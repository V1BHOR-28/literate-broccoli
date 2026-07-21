"""PostgreSQL access layer.

Uses a ``psycopg2`` :class:`~psycopg2.pool.ThreadedConnectionPool` so that
FastAPI's def-thread (regular ``def`` endpoints) can each borrow a real
connection. The pool is created lazily on first use and torn down on
application shutdown.

All SQL in the codebase uses explicit column lists — never ``SELECT *``
(per AGENTS.md).
"""
from __future__ import annotations

from contextlib import contextmanager
from typing import Iterator

from psycopg2.extras import RealDictCursor, register_uuid
from psycopg2.pool import ThreadedConnectionPool
from pgvector.psycopg2 import register_vector

from config import settings

# Module-level pool; created by ``init_pool`` during app startup.
_pool: ThreadedConnectionPool | None = None


def init_pool(minconn: int = 1, maxconn: int = 10) -> None:
    """Initialise the global connection pool.

    Safe to call once during the FastAPI lifespan startup event.
    """
    global _pool
    if _pool is not None:
        return
    _pool = ThreadedConnectionPool(
        minconn=minconn, maxconn=maxconn, dsn=settings.database_url
    )
    register_uuid()


def close_pool() -> None:
    """Close all pooled connections. Called during shutdown."""
    global _pool
    if _pool is not None:
        _pool.closeall()
        _pool = None


@contextmanager
def get_conn() -> Iterator[object]:
    """Yield a pooled connection, guaranteeing it is returned to the pool.

    Raises :class:`RuntimeError` if the pool has not been initialised — this
    indicates the application lifespan did not run (a programming error).
    """
    if _pool is None:
        raise RuntimeError("Database pool is not initialised. Call init_pool() first.")
    conn = _pool.getconn()
    try:
        register_vector(conn)
        yield conn
    finally:
        _pool.putconn(conn)


@contextmanager
def get_cursor(commit: bool = False) -> Iterator[RealDictCursor]:
    """Yield a :class:`RealDictCursor` scoped to a single transaction.

    ``RealDictCursor`` returns rows as ``dict`` keyed by column name, which
    makes row -> Pydantic model mapping trivial.

    Args:
        commit: When True, ``conn.commit()`` is called on clean exit. Any
            exception rolls back the transaction and re-raises.
    """
    with get_conn() as conn:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        try:
            yield cur
            if commit:
                conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            cur.close()
