-- V2: api_endpoint source kind + source_config for custom headers

-- Drop old CHECK constraint and replace with one that includes api_endpoint
ALTER TABLE sources DROP CONSTRAINT IF EXISTS sources_kind_check;
ALTER TABLE sources ADD CONSTRAINT sources_kind_check
  CHECK (kind IN ('sitemap', 'html', 'pdf', 'markdown', 'api_endpoint'));

-- source_config stores per-source settings (e.g. custom HTTP headers for api_endpoint)
ALTER TABLE sources
  ADD COLUMN IF NOT EXISTS source_config JSONB NOT NULL DEFAULT '{}';
