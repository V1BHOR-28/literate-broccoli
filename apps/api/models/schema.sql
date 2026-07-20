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
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL CHECK (source_type IN ('project', 'kpi', 'kpi_history', 'chat', 'summary')),
    source_id UUID NOT NULL,
    kind TEXT NOT NULL,
    content_text TEXT NOT NULL,
    embedding vector(768) NOT NULL,
    content_hash TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    superseded_by UUID REFERENCES memory_vectors(id) ON DELETE SET NULL,
    content_tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', content_text)) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content_text TEXT NOT NULL CHECK (length(trim(content_text)) > 0),
    citations JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE memory_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
    content_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE embedding_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL CHECK (source_type IN ('project', 'kpi', 'kpi_history', 'chat', 'summary')),
    source_id UUID NOT NULL,
    kind TEXT NOT NULL,
    content_text TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_kpis_project_id ON kpis(project_id);
CREATE INDEX idx_kpi_history_kpi_changed_at ON kpi_history(kpi_id, changed_at DESC);
CREATE INDEX idx_memory_vectors_source ON memory_vectors(source_type, source_id);
CREATE INDEX idx_memory_vectors_project_active ON memory_vectors(project_id) WHERE superseded_by IS NULL;
CREATE UNIQUE INDEX uq_memory_vectors_content_hash ON memory_vectors(content_hash);
CREATE INDEX idx_memory_vectors_embedding_cosine ON memory_vectors USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_memory_vectors_content_tsv ON memory_vectors USING gin(content_tsv);
CREATE INDEX idx_chat_messages_session_created ON chat_messages(session_id, created_at);
CREATE INDEX idx_embedding_jobs_available ON embedding_jobs(status, available_at) WHERE status IN ('pending', 'failed');
CREATE UNIQUE INDEX uq_embedding_jobs_content_hash ON embedding_jobs(content_hash);

-- Down migration (run in reverse dependency order):
-- DROP TABLE IF EXISTS memory_vectors;
-- DROP TABLE IF EXISTS kpi_history;
-- DROP TABLE IF EXISTS kpis;
-- DROP TABLE IF EXISTS projects;
