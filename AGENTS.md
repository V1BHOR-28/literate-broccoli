output)</think>Here is the exact `AGENTS.md` file. Just copy everything inside the box below, paste it into your text editor, and save it as `AGENTS.md` in the root of your `ai-pm-tool` folder.

```markdown
# AGENTS.md – Project Rules for AI Project Mgmt Tool

## Stack
- Monorepo: Turborepo
- Frontend: Next.js 14+ (App Router), TypeScript, Tailwind CSS, Recharts, TanStack Table
- Backend: Python 3.11+, FastAPI, Pydantic V2
- Database: PostgreSQL with pgvector
- AI / Memory: LangChain, OpenAI API (or compatible)

## Repo Layout
- apps/web        – Next.js frontend
- apps/api        – FastAPI backend
- packages/shared – Shared TypeScript types (API contracts)

## Commands
- Install (monorepo): `npm install` (in repo root)
- Dev frontend: `npm run dev --workspace=apps/web`
- Dev backend: `cd apps/api && python -m uvicorn main:app --reload`
- Docker: `docker compose up` (Postgres + pgvector)

## Code Style
- TypeScript: strict, no `any`, prefer named exports, small functions.
- Python: type hints everywhere, use Pydantic models, functions small and typed.
- SQL: prefer explicit column lists, avoid SELECT *.
- Tailwind: use utility classes only, avoid custom CSS unless absolutely necessary.

## Memory-Critical Constraints
- Every KPI value change MUST include a `change_reason` text field.
- Every KPI value change MUST be recorded in `kpi_history` (old, new, who, why, when).
- Any fact the AI should remember across sessions MUST be stored in:
  - Structured DB tables (projects, kpis, kpi_history), AND
  - As embedded text in `memory_vectors` (with source_type, source_id, content_text, embedding).
- Never store sensitive secrets in code or embeddings; use env vars / secret manager.

## Testing & Validation
- When changing backend code, run existing tests if any.
- When changing frontend components, ensure the build passes: `npm run build --workspace=apps/web`.
- When changing SQL schema, ensure migrations are reversible and documented.

## Workflow
- Prefer small, reviewable commits over large rewrites.
- Always open a PR (or describe one) for major changes.
- When scaffolding, include placeholder README.md files with "TODO: description".
```
