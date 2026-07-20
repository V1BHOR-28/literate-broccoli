-- Apply with a PostgreSQL 16 instance that has pgvector installed.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_value NUMERIC NOT NULL,
    current_value NUMERIC NOT NULL,
    unit TEXT,
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE kpi_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kpi_id UUID NOT NULL REFERENCES kpis(id) ON DELETE CASCADE,
    old_value NUMERIC NOT NULL,
    new_value NUMERIC NOT NULL,
    changed_by TEXT NOT NULL,
    change_reason TEXT NOT NULL CHECK (length(trim(change_reason)) > 0),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE memory_vectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type TEXT NOT NULL CHECK (source_type IN ('project', 'kpi', 'chat')),
    source_id UUID NOT NULL,
    content_text TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kpis_project_id ON kpis(project_id);
CREATE INDEX idx_kpi_history_kpi_changed_at ON kpi_history(kpi_id, changed_at DESC);
CREATE INDEX idx_memory_vectors_source ON memory_vectors(source_type, source_id);

-- Down migration (run in reverse dependency order):
-- DROP TABLE IF EXISTS memory_vectors;
-- DROP TABLE IF EXISTS kpi_history;
-- DROP TABLE IF EXISTS kpis;
-- DROP TABLE IF EXISTS projects;
