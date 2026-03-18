-- V3.5: gemini_file source kind — multimodal ingestion via Google Gemini

ALTER TABLE sources DROP CONSTRAINT IF EXISTS sources_kind_check;
ALTER TABLE sources ADD CONSTRAINT sources_kind_check
  CHECK (kind IN ('sitemap', 'html', 'pdf', 'markdown', 'api_endpoint', 'youtube', 'notion', 'gemini_file'));
