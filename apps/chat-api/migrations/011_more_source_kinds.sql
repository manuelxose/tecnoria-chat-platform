-- V2: Ampliar fuentes de conocimiento — YouTube y Notion

ALTER TABLE sources DROP CONSTRAINT IF EXISTS sources_kind_check;
ALTER TABLE sources ADD CONSTRAINT sources_kind_check
  CHECK (kind IN ('sitemap', 'html', 'pdf', 'markdown', 'api_endpoint', 'youtube', 'notion'));
