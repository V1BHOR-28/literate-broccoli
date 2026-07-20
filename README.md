# Signalboard

Signalboard is an AI-powered project management foundation with a Power-BI-style KPI dashboard and durable memory. KPI value changes are designed to retain who made the change, why it happened, and when it occurred, while AI-relevant facts can be stored alongside vector embeddings.

## Run locally

Install JavaScript dependencies from the repository root:

```bash
npm install
npm run dev --workspace=apps/web
```

Run the API from a second terminal:

```bash
cd apps/api
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload
```

The database definition is in `apps/api/models/schema.sql`. Start PostgreSQL locally with `docker compose up` after using a PostgreSQL 16 image that includes pgvector.
