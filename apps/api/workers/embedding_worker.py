"""Durable embedding outbox worker; Gemini calls occur outside CRUD transactions."""
from __future__ import annotations

import logging
from threading import Event
from typing import Any

from psycopg2.extras import Json

from db import get_cursor
from memory_service import embed_text

logger = logging.getLogger(__name__)
MAX_ATTEMPTS = 5


def claim_embedding_jobs(limit: int = 10) -> list[dict[str, Any]]:
    """Atomically claim ready work without blocking concurrent workers."""
    with get_cursor(commit=True) as cur:
        cur.execute(
            """
            WITH candidates AS (
                SELECT id
                FROM embedding_jobs
                WHERE status = 'pending' AND available_at <= now()
                ORDER BY created_at ASC
                FOR UPDATE SKIP LOCKED
                LIMIT %(limit)s
            )
            UPDATE embedding_jobs AS jobs
            SET status = 'processing', attempts = jobs.attempts + 1
            FROM candidates
            WHERE jobs.id = candidates.id
            RETURNING jobs.id, jobs.project_id, jobs.source_type, jobs.source_id,
                      jobs.kind, jobs.content_text, jobs.content_hash, jobs.metadata,
                      jobs.attempts;
            """,
            {"limit": limit},
        )
        return [dict(row) for row in cur.fetchall()]


def complete_embedding_job(job: dict[str, Any], embedding: list[float]) -> None:
    """Upsert the derived vector and complete its job in one transaction."""
    with get_cursor(commit=True) as cur:
        cur.execute(
            """
            INSERT INTO memory_vectors
                (project_id, source_type, source_id, kind, content_text, embedding,
                 content_hash, metadata)
            VALUES
                (%(project_id)s, %(source_type)s, %(source_id)s, %(kind)s,
                 %(content_text)s, %(embedding)s::vector, %(content_hash)s, %(metadata)s)
            ON CONFLICT (content_hash) DO NOTHING;
            """,
            {**job, "embedding": embedding, "metadata": Json(job["metadata"] or {})},
        )
        cur.execute(
            """
            UPDATE embedding_jobs
            SET status = 'completed', completed_at = now(), last_error = NULL
            WHERE id = %(id)s;
            """,
            {"id": job["id"]},
        )


def fail_embedding_job(job: dict[str, Any], error: Exception) -> None:
    """Return transient failures to the queue with bounded exponential backoff."""
    logger.warning("Embedding job %s failed: %s", job["id"], error)
    with get_cursor(commit=True) as cur:
        cur.execute(
            """
            UPDATE embedding_jobs
            SET status = CASE WHEN attempts >= %(max_attempts)s THEN 'failed' ELSE 'pending' END,
                available_at = now() + make_interval(
                    secs => LEAST(300, CAST(power(2, attempts) AS integer))
                ),
                last_error = %(error)s
            WHERE id = %(id)s;
            """,
            {"id": job["id"], "max_attempts": MAX_ATTEMPTS, "error": str(error)[:1000]},
        )


def process_pending_jobs(limit: int = 10) -> int:
    """Process one claimed batch and return the number of successful writes."""
    jobs = claim_embedding_jobs(limit)
    completed = 0
    for job in jobs:
        try:
            complete_embedding_job(job, embed_text(job["content_text"]))
            completed += 1
        except Exception as exc:  # External APIs and database writes must be retried.
            fail_embedding_job(job, exc)
    return completed


def run_embedding_worker(stop_event: Event) -> None:
    """Poll the durable outbox until application shutdown signals the event."""
    from config import settings

    while not stop_event.is_set():
        try:
            processed = process_pending_jobs()
            if processed:
                continue
        except Exception:  # Keep a transient worker issue from killing the worker thread.
            logger.exception("Embedding worker loop failed")
        stop_event.wait(settings.memory_worker_poll_seconds)
