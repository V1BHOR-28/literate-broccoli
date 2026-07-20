"""Idempotent schema bootstrap.

On application startup we check whether the ``projects`` table exists; if not,
we execute the raw SQL from ``models/schema.sql``. This guarantees a fresh
developer checkout can ``docker compose up`` + ``uvicorn`` against an empty
database and get a working API without a manual migrate step.

The schema file already uses ``CREATE EXTENSION IF NOT EXISTS`` and our own
``CREATE TABLE`` statements do not include ``IF NOT EXISTS`` — so we must run
the whole file only when the schema is actually missing (otherwise CREATE
TABLE would error). That is what :func:`schema_exists` guards against.
"""
from __future__ import annotations

import logging

from db import get_cursor
from config import settings

logger = logging.getLogger(__name__)


def schema_exists() -> bool:
    """Return True if the ``projects`` table already exists."""
    with get_cursor() as cur:
        cur.execute(
            "SELECT to_regclass('public.projects') IS NOT NULL AS exists;"
        )
        row = cur.fetchone()
    return bool(row and row["exists"])


def apply_schema() -> None:
    """Execute ``models/schema.sql`` when the schema is not present yet."""
    if schema_exists():
        logger.info("Schema already present — skipping bootstrap.")
        return

    logger.info("Schema missing — applying %s", settings.schema_path)
    with open(settings.schema_path, "r", encoding="utf-8") as fh:
        sql = fh.read()

    # schema.sql is a single DDL script with no statement delimiters beyond
    # semicolons, so we let psycopg2 execute it as one batch and commit once.
    with get_cursor(commit=True) as cur:
        cur.execute(sql)
    logger.info("Schema applied successfully.")
