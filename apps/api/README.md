# @ai-pm/api

FastAPI backend for the AI Project Management tool. Speaks camelCase JSON over
the wire (matching `packages/shared/types/api.ts`) and writes snake_case to
PostgreSQL.

## Layout

| File                  | Responsibility                                             |
| --------------------- | --------------------------------------------------------- |
| `main.py`             | FastAPI app, lifespan (pool init + schema bootstrap), CORS |
| `config.py`           | Reads `DATABASE_URL` / CORS origins from env (no secrets) |
| `db.py`               | Threaded `psycopg2` connection pool + cursor context       |
| `schemas.py`          | Pydantic V2 models (snake_case fields, camelCase aliases)  |
| `repositories.py`     | Explicit-column SQL + row → model mappers                  |
| `routes/projects.py`  | `GET/POST /projects`                                       |
| `routes/kpis.py`      | `GET/POST /projects/{id}/kpis`, `PATCH /kpis/{id}/value`   |
| `schema_bootstrap.py` | Applies `models/schema.sql` on startup if schema missing   |
| `errors.py`           | `NotFoundError` + JSON exception handlers                  |
| `models/schema.sql`   | Canonical Postgres DDL (owned by this service)             |

## Endpoints (camelCase JSON)

- `GET    /projects`                → `Project[]`
- `POST   /projects`                → `Project` (201)
- `GET    /projects/{id}/kpis`      → `Kpi[]` (each with `history[]`)
- `POST   /projects/{id}/kpis`      → `Kpi` (201)
- `PATCH  /kpis/{id}/value`         → `Kpi` (writes a `kpi_history` row in the same transaction)
- `GET    /health`                  → `{"status":"ok"}`

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env        # then edit if your DB differs from docker-compose
docker compose up db        # Postgres + pgvector
python -m uvicorn main:app --reload   # serves http://localhost:8000
```

The first request after startup auto-applies `models/schema.sql` when the
`projects` table is missing, so a fresh database needs no manual migrate step.

## Memory-critical constraint

Every `PATCH /kpis/{id}/value` MUST include `changedBy` and a non-empty
`changeReason`. The repository updates `kpis.current_value` and inserts a
`kpi_history` row inside one transaction so the audit trail can never lag the
value change. See `AGENTS.md` for the full constraint.
