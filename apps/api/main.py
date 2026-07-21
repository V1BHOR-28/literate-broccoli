from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import os

from db import init_pool, close_pool
from schema_bootstrap import apply_schema

# Import routers (Phase 2 & 5)
from routes.projects import router as projects_router
from routes.kpis import project_kpis_router, kpi_value_router
from routes.chat import router as chat_router

logging.basicConfig(level=logging.INFO)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logging.info("Startup: Initializing DB pool...")
    init_pool()
    try:
        apply_schema()
    except Exception as e:
        logging.error(f"Schema migration failed: {e}")
        close_pool()
        raise
    logging.info("Startup complete.")
    yield
    logging.info("Shutdown: Closing DB pool.")
    close_pool()

app = FastAPI(title="Jarvis PM API", version="0.3.0", lifespan=lifespan)

# CORS Configuration: Allow origins from env or default to *
allow_origins_env = os.getenv("CORS_ORIGINS", "*").strip('"').strip("'")
allow_origins = [o.strip() for o in allow_origins_env.split(",")] if allow_origins_env != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REGISTER ALL ROUTES (CRITICAL STEP)
app.include_router(projects_router)
app.include_router(project_kpis_router)
app.include_router(kpi_value_router)
app.include_router(chat_router)

@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "Jarvis PM API is running. Access /docs for documentation."}

@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}