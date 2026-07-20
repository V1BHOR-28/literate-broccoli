-- Phase 5 Memory & RAG upgrade.  This script is intentionally idempotent.
-- Down migration: drop indexes added below, then embedding_jobs, memory_summaries,
-- chat_messages, chat_sessions; finally drop the added memory_vectors columns.

ALTER TABLE memory_vectors ALTER COLUMN embedding TYPE vector(768);
ALTER TABLE memory_vectors ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE memory_vectors ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'legacy';
ALTER TABLE memory_vectors ADD COLUMN IF NOT EXISTS content_hash TEXT;
ALTER TABLE memory_vectors ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE memory_vectors ADD COLUMN IF NOT EXISTS superseded_by UUID REFERENCES memory_vectors(id) ON DELETE SET NULL;
ALTER TABLE memory_vectors ADD COLUMN IF NOT EXISTS content_tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', content_text)) STORED;

ALTER TABLE memory_vectors DROP CONSTRAINT IF EXISTS memory_vectors_source_type_check;
ALTER TABLE memory_vectors ADD CONSTRAINT memory_vectors_source_type_check
    CHECK (source_type IN ('project', 'kpi', 'kpi_history', 'chat', 'summary'));

UPDATE memory_vectors AS m
SET project_id = p.id
FROM projects AS p
WHERE m.source_type = 'project' AND m.source_id = p.id AND m.project_id IS NULL;

UPDATE memory_vectors AS m
SET project_id = k.project_id
FROM kpis AS k
WHERE m.source_type = 'kpi' AND m.source_id = k.id AND m.project_id IS NULL;

CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content_text TEXT NOT NULL CHECK (length(trim(content_text)) > 0),
    citations JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS memory_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
    content_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS embedding_jobs (
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

CREATE UNIQUE INDEX IF NOT EXISTS uq_memory_vectors_content_hash ON memory_vectors(content_hash);
CREATE INDEX IF NOT EXISTS idx_memory_vectors_project_active ON memory_vectors(project_id) WHERE superseded_by IS NULL;
CREATE INDEX IF NOT EXISTS idx_memory_vectors_embedding_cosine ON memory_vectors USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_memory_vectors_content_tsv ON memory_vectors USING gin(content_tsv);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created ON chat_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_embedding_jobs_available ON embedding_jobs(status, available_at) WHERE status IN ('pending', 'failed');
CREATE UNIQUE INDEX IF NOT EXISTS uq_embedding_jobs_content_hash ON embedding_jobs(content_hash);
