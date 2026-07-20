from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

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

# CORS FIX: Allow all origins for deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REGISTER ALL ROUTES (CRITICAL STEP)
app.include_router(projects_router)
app.include_router(project_kpis_router)
app.include_router(kpi_value_router)
app.include_router(chat_router)

@app.get("/health")
def health_check():
    return {"status": "ok"}