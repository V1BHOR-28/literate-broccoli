"""Fresh-schema bootstrap and idempotent versioned migrations."""
from __future__ import annotations

import logging
from pathlib import Path

from config import settings
from db import get_cursor

logger = logging.getLogger(__name__)


def schema_exists() -> bool:
    """Return whether the base projects table already exists."""
    with get_cursor() as cur:
        cur.execute("SELECT to_regclass('public.projects') IS NOT NULL AS exists;")
        row = cur.fetchone()
    return bool(row and row["exists"])


def apply_schema() -> None:
    """Install the fresh schema if needed, then run outstanding migrations."""
    if not schema_exists():
        logger.info("Schema missing; applying %s", settings.schema_path)
        sql = Path(settings.schema_path).read_text(encoding="utf-8")
        with get_cursor(commit=True) as cur:
            cur.execute(sql)
    apply_migrations()


def apply_migrations() -> None:
    """Run each migration once and record the version transactionally."""
    migrations_dir = Path(__file__).with_name("migrations")
    with get_cursor(commit=True) as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version TEXT PRIMARY KEY,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
            );
            """
        )
        cur.execute("SELECT version FROM schema_migrations;")
        applied = {row["version"] for row in cur.fetchall()}
        for migration_path in sorted(migrations_dir.glob("*.sql")):
            version = migration_path.stem
            if version in applied:
                continue
            logger.info("Applying migration %s", migration_path.name)
            cur.execute(migration_path.read_text(encoding="utf-8"))
            cur.execute("INSERT INTO schema_migrations (version) VALUES (%s);", (version,))
