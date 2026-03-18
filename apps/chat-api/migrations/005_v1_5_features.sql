-- V1.5 Features: API keys, webhooks, ingestion schedules, conversation ratings, notification prefs

-- API Keys per tenant
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant ON api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);

-- Webhooks per tenant
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  secret_hash TEXT NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_webhooks_tenant ON webhooks(tenant_id);

-- Ingestion schedules
CREATE TABLE IF NOT EXISTS ingestion_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source_ids UUID[] NOT NULL DEFAULT '{}',
  cron_expr TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ingestion_schedules_tenant ON ingestion_schedules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_schedules_next_run ON ingestion_schedules(active, next_run_at) WHERE active = true;

-- Conversation ratings (CSAT)
CREATE TABLE IF NOT EXISTS conversation_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversation_ratings_unique ON conversation_ratings(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_ratings_project ON conversation_ratings(project_id);

-- Notification preferences per tenant
CREATE TABLE IF NOT EXISTS notification_prefs (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  email_recipients TEXT[] NOT NULL DEFAULT '{}',
  lead_created BOOLEAN NOT NULL DEFAULT true,
  ingestion_failed BOOLEAN NOT NULL DEFAULT true,
  low_confidence_alert BOOLEAN NOT NULL DEFAULT false,
  low_confidence_threshold NUMERIC(5,4) NOT NULL DEFAULT 0.3,
  digest_frequency TEXT NOT NULL DEFAULT 'none' CHECK (digest_frequency IN ('none','daily','weekly')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invitations table for workspace member invites
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin','editor','viewer')),
  invited_by UUID REFERENCES users(id),
  token_hash TEXT NOT NULL UNIQUE,
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_tenant_email ON invitations(tenant_id, email) WHERE accepted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token_hash);
