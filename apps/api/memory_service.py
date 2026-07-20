"""Raw-SQL memory indexing, retrieval, and authoritative KPI snapshot helpers."""
from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Any, Iterable
from uuid import UUID

from psycopg2.extras import Json, RealDictCursor

from config import settings
from db import get_cursor
from schemas import Kpi, LiveKpiSnapshot, MemorySourceType


@dataclass(frozen=True)
class RetrievedMemory:
    id: UUID
    source_type: str
    source_id: UUID
    kind: str
    content_text: str
    created_at: datetime
    score: float


def _display(value: float | Decimal | str | None) -> str:
    if value is None:
        return ""
    return value if isinstance(value, str) else format(value, "f")


def build_project_text(*, name: str, description: str | None) -> str:
    """Render stable, human-readable project memory text."""
    return f"Project: {name}. Description: {description or 'No description provided.'}"


def build_kpi_text(*, project_name: str, name: str, target_value: float, unit: str | None, frequency: str) -> str:
    """Render a KPI definition without presenting a mutable current value as fact."""
    suffix = f" {_display(unit)}" if unit else ""
    return (
        f"Project: {project_name}. KPI definition: {name}. "
        f"Target: {_display(target_value)}{suffix}. Frequency: {frequency}."
    )


def build_kpi_history_text(*, project_name: str, kpi_name: str, old_value: float, new_value: float, unit: str | None, changed_by: str, change_reason: str, changed_at: datetime) -> str:
    """Render an immutable KPI audit event for semantic retrieval."""
    suffix = f" {unit}" if unit else ""
    return (
        f"Project: {project_name}. KPI '{kpi_name}' changed from {_display(old_value)}"
        f" to {_display(new_value)}{suffix} by {changed_by} on {changed_at.date().isoformat()}. "
        f"Reason: {change_reason.strip()}"
    )


def build_chat_text(content_text: str) -> str:
    """Preserve a user message verbatim, apart from whitespace normalization."""
    return " ".join(content_text.split())


def content_hash(*, kind: str, source_id: UUID, content_text: str) -> str:
    normalized = " ".join(content_text.split()).strip().lower()
    payload = f"{kind}:{source_id}:{normalized}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def enqueue_embedding_job(
    cur: RealDictCursor,
    *,
    project_id: UUID,
    source_type: MemorySourceType,
    source_id: UUID,
    kind: str,
    content_text: str,
    metadata: dict[str, Any] | None = None,
) -> None:
    """Queue a durable, idempotent embedding job using the caller transaction."""
    digest = content_hash(kind=kind, source_id=source_id, content_text=content_text)
    cur.execute(
        """
        INSERT INTO embedding_jobs
            (project_id, source_type, source_id, kind, content_text, content_hash, metadata)
        VALUES
            (%(project_id)s, %(source_type)s, %(source_id)s, %(kind)s,
             %(content_text)s, %(content_hash)s, %(metadata)s)
        ON CONFLICT (content_hash) DO NOTHING;
        """,
        {
            "project_id": project_id,
            "source_type": source_type,
            "source_id": source_id,
            "kind": kind,
            "content_text": content_text,
            "content_hash": digest,
            "metadata": Json(metadata or {}),
        },
    )


def embed_text(text: str) -> list[float]:
    """Embed text with Gemini outside the caller's CRUD transaction."""
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is required for embedding")
    from langchain_google_genai import GoogleGenerativeAIEmbeddings

    client = GoogleGenerativeAIEmbeddings(
        model=settings.embedding_model,
        google_api_key=settings.gemini_api_key,
    )
    vector = client.embed_query(text)
    if len(vector) != 768:
        raise RuntimeError(f"Expected a 768-dimensional embedding, received {len(vector)}")
    return vector


def _rrf_rank(rows: Iterable[dict[str, Any]], ranks: dict[UUID, float], weight: float = 1.0) -> dict[UUID, dict[str, Any]]:
    candidates: dict[UUID, dict[str, Any]] = {}
    for rank, row in enumerate(rows, start=1):
        memory_id = row["id"]
        candidates[memory_id] = dict(row)
        ranks[memory_id] = ranks.get(memory_id, 0.0) + weight / (60 + rank)
    return candidates


def search_memories(*, project_id: UUID, query_text: str, limit: int | None = None) -> list[RetrievedMemory]:
    """Run project-scoped vector and keyword searches, then fuse them with RRF."""
    query_vector = embed_text(query_text)
    candidate_limit = 30
    final_limit = limit or settings.retrieval_top_k
    with get_cursor() as cur:
        cur.execute(
            """
            SELECT id, source_type, source_id, kind, content_text, created_at
            FROM memory_vectors
            WHERE project_id = %(project_id)s
              AND superseded_by IS NULL
            ORDER BY embedding <=> %(query_vector)s::vector
            LIMIT %(limit)s;
            """,
            {"project_id": project_id, "query_vector": query_vector, "limit": candidate_limit},
        )
        semantic_rows = cur.fetchall()
        cur.execute(
            """
            SELECT id, source_type, source_id, kind, content_text, created_at
            FROM memory_vectors
            WHERE project_id = %(project_id)s
              AND superseded_by IS NULL
              AND content_tsv @@ plainto_tsquery('english', %(query_text)s)
            ORDER BY ts_rank_cd(content_tsv, plainto_tsquery('english', %(query_text)s)) DESC
            LIMIT %(limit)s;
            """,
            {"project_id": project_id, "query_text": query_text, "limit": candidate_limit},
        )
        keyword_rows = cur.fetchall()

    scores: dict[UUID, float] = {}
    candidates = _rrf_rank(semantic_rows, scores)
    candidates.update(_rrf_rank(keyword_rows, scores))
    ranked = sorted(candidates.values(), key=lambda row: scores[row["id"]], reverse=True)
    return [
        RetrievedMemory(
            id=row["id"], source_type=row["source_type"], source_id=row["source_id"],
            kind=row["kind"], content_text=row["content_text"], created_at=row["created_at"],
            score=scores[row["id"]],
        )
        for row in ranked[:final_limit]
    ]


def build_live_kpi_snapshot(project_id: UUID) -> list[LiveKpiSnapshot]:
    """Fetch the current KPI values directly from kpis; vectors are never consulted."""
    with get_cursor() as cur:
        cur.execute(
            """
            SELECT id, name, target_value, current_value, unit, frequency, updated_at
            FROM kpis
            WHERE project_id = %(project_id)s
            ORDER BY created_at ASC;
            """,
            {"project_id": project_id},
        )
        rows = cur.fetchall()
    return [LiveKpiSnapshot.model_validate(dict(row)) for row in rows]
