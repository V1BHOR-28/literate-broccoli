"""FastAPI application entrypoint.

Wires:
* a lifespan startup/shutdown event that initialises the connection pool and
  applies ``models/schema.sql`` when the schema is missing;
* the project and KPI routers (camelCase JSON per the shared API contract);
* the JSON exception handlers; and
* CORS for the Next.js frontend.
"""
from __future__ import annotations

import logging
from threading import Event, Thread
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from db import close_pool, init_pool
from errors import register_exception_handlers
from routes.kpis import kpi_value_router, project_kpis_router
from routes.projects import router as projects_router
from routes.chat import router as chat_router
from schema_bootstrap import apply_schema
from workers.embedding_worker import run_embedding_worker

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """Initialise the DB pool, apply schema, then tear down on shutdown."""
    logger.info("Initialising database connection pool.")
    init_pool()
    try:
        apply_schema()
    except Exception:  # noqa: BLE001 — log and re-raise so startup fails loudly
        logger.exception("Schema bootstrap failed.")
        close_pool()
        raise
    logger.info("Startup complete.")
    worker_stop = Event()
    worker: Thread | None = None
    if settings.gemini_api_key:
        worker = Thread(
            target=run_embedding_worker,
            args=(worker_stop,),
            name="jarvis-embedding-worker",
            daemon=True,
        )
        worker.start()
    else:
        logger.warning("Embedding worker not started: GEMINI_API_KEY is not configured.")
    try:
        yield
    finally:
        worker_stop.set()
        if worker is not None:
            worker.join(timeout=10)
        logger.info("Closing database connection pool.")
        close_pool()


app = FastAPI(
    title="AI Project Management API",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(projects_router)
app.include_router(project_kpis_router)
app.include_router(kpi_value_router)
app.include_router(chat_router)


@app.get("/health")
def health_check() -> dict[str, str]:
    """Liveness probe (does not touch the database)."""
    return {"status": "ok"}
