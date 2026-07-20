"""Application configuration sourced from environment variables.

No secrets are hardcoded here (per AGENTS.md "Never store sensitive secrets
in code"). Every value has a development-only default that must be overridden
in production via environment variables.
"""
from __future__ import annotations

import os
from dataclasses import dataclass


def _get_database_url() -> str:
    """Return the PostgreSQL connection URL.

    Reads ``DATABASE_URL`` from the environment. When unset, falls back to the
    credentials used by the repository's ``docker-compose.yml``
    (user/password/db ``ai_pm``) so local development works out of the box.
    """
    value = os.getenv("DATABASE_URL")
    if value:
        return value
    password = os.getenv("POSTGRES_PASSWORD", "local-development-only")
    return f"postgresql://ai_pm:{password}@localhost:5432/ai_pm"


@dataclass(frozen=True)
class Settings:
    """Runtime settings for the API process."""

    database_url: str
    cors_origins: tuple[str, ...]
    schema_path: str


def get_settings() -> Settings:
    """Build a :class:`Settings` instance from the current environment."""
    raw_cors = os.getenv("CORS_ORIGINS", "http://localhost:3000")
    cors_origins = tuple(
        origin.strip() for origin in raw_cors.split(",") if origin.strip()
    )
    return Settings(
        database_url=_get_database_url(),
        cors_origins=cors_origins,
        schema_path=os.path.join(os.path.dirname(__file__), "models", "schema.sql"),
    )


settings = get_settings()
