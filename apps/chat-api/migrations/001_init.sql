CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  site_key TEXT NOT NULL UNIQUE,
  language TEXT NOT NULL DEFAULT 'es',
  allowed_domains TEXT[] NOT NULL DEFAULT '{}',
  bot_name TEXT NOT NULL,
  welcome_message TEXT NOT NULL,
  prompt_policy JSONB NOT NULL DEFAULT '{}'::jsonb,
  cta_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  widget_theme JSONB NOT NULL DEFAULT '{}'::jsonb,
  lead_sink JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prompt_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS widget_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source_key TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('sitemap', 'html', 'pdf', 'markdown')),
  entry_url TEXT NOT NULL,
  include_patterns TEXT[] NOT NULL DEFAULT '{}',
  exclude_patterns TEXT[] NOT NULL DEFAULT '{}',
  allowed_domains TEXT[] NOT NULL DEFAULT '{}',
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  default_category TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, source_key)
);

CREATE TABLE IF NOT EXISTS ingestion_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'done', 'failed')),
  requested_by TEXT,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  canonical_url TEXT NOT NULL,
  title TEXT NOT NULL,
  doc_type TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'es',
  category TEXT,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  current_version INTEGER NOT NULL DEFAULT 0,
  latest_checksum TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_ingested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, canonical_url)
);

CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_no INTEGER NOT NULL,
  checksum TEXT NOT NULL,
  etag TEXT,
  last_modified TEXT,
  raw_text TEXT NOT NULL,
  normalized_text TEXT NOT NULL,
  section_path TEXT[] NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(document_id, version_no)
);

CREATE TABLE IF NOT EXISTS chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  document_version_id UUID NOT NULL REFERENCES document_versions(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  heading TEXT,
  body TEXT NOT NULL,
  section_path TEXT[] NOT NULL DEFAULT '{}',
  tokens_estimate INTEGER NOT NULL DEFAULT 0,
  search_vector TSVECTOR NOT NULL,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(document_version_id, chunk_index)
);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  site_key TEXT NOT NULL,
  origin TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  body TEXT NOT NULL,
  citations JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence NUMERIC(5, 4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lead_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  payload JSONB NOT NULL,
  delivery_status TEXT NOT NULL DEFAULT 'pending',
  delivery_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sources_project_id ON sources(project_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_status ON ingestion_jobs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_project_url ON documents(project_id, canonical_url);
CREATE INDEX IF NOT EXISTS idx_chunks_project_search_vector ON chunks USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_lead_events_project ON lead_events(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_project ON analytics_events(project_id, event_type, created_at DESC);
