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
    gemini_api_key: str
    embedding_model: str
    chat_model: str
    retrieval_top_k: int
    memory_worker_poll_seconds: float


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
        gemini_api_key=os.getenv("GEMINI_API_KEY", ""),
        embedding_model=os.getenv("GEMINI_EMBEDDING_MODEL", "models/text-embedding-004"),
        chat_model=os.getenv("GEMINI_CHAT_MODEL", "gemini-1.5-flash"),
        retrieval_top_k=int(os.getenv("MEMORY_RETRIEVAL_TOP_K", "8")),
        memory_worker_poll_seconds=float(os.getenv("MEMORY_WORKER_POLL_SECONDS", "2")),
    )


settings = get_settings()
