-- V3-D: Multicanal — tabla channels (Telegram, futuro WhatsApp)

CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('telegram', 'whatsapp')),
  config JSONB NOT NULL DEFAULT '{}',
  -- telegram config shape: { botToken: string, webhookSecret: string }
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS channels_project_id_idx ON channels(project_id);
