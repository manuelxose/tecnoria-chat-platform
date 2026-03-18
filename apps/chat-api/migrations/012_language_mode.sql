-- V2-G: Multi-language auto-detection

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS language_mode TEXT NOT NULL DEFAULT 'fixed'
    CHECK (language_mode IN ('fixed', 'auto'));

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS detected_language TEXT;
