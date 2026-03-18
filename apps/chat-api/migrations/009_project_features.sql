-- V2: Per-project feature flags

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS enable_handover BOOLEAN NOT NULL DEFAULT false;
