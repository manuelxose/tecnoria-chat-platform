CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'disabled')),
  brand_name TEXT,
  public_base_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  display_name TEXT,
  platform_role TEXT NOT NULL DEFAULT 'member' CHECK (platform_role IN ('superadmin', 'member')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'disabled')),
  email_verified_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

CREATE TABLE IF NOT EXISTS access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  requested_tenant_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  brand_name TEXT NOT NULL DEFAULT 'Tecnoria Chat',
  legal_name TEXT NOT NULL DEFAULT 'Tecnoria Chat Platform',
  tagline TEXT NOT NULL DEFAULT 'Asistentes conversacionales listos para integrarse en productos y operaciones.',
  summary TEXT NOT NULL DEFAULT 'Plataforma multi-tenant para desplegar asistentes conversacionales con widget, analitica, ingestas y control operativo.',
  support_email TEXT NOT NULL DEFAULT 'oficina@tecnoria.com',
  website_url TEXT NOT NULL DEFAULT 'https://tecnoriasl.com',
  product_domain TEXT NOT NULL DEFAULT 'chat.tecnoriasl.com',
  portal_base_url TEXT NOT NULL DEFAULT 'http://localhost:4103',
  api_base_url TEXT NOT NULL DEFAULT 'http://localhost:4101',
  widget_base_url TEXT NOT NULL DEFAULT 'http://localhost:4102',
  developed_by TEXT NOT NULL DEFAULT 'Tecnoria',
  demo_project_key TEXT NOT NULL DEFAULT 'tecnoria',
  demo_site_key TEXT NOT NULL DEFAULT 'tecnoria-public-site-key',
  hero_points JSONB NOT NULL DEFAULT '[
    "Landing propia con widget embebible",
    "Panel tenant por integracion o cliente",
    "Superadmin con control global"
  ]'::jsonb,
  feature_flags JSONB NOT NULL DEFAULT '{
    "publicAccessRequests": true,
    "tenantConsole": true,
    "superadmin": true
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO tenants (slug, name, status, brand_name, metadata)
VALUES (
  'platform-default',
  'Platform Default Tenant',
  'active',
  'Tecnoria Chat',
  '{"seededByMigration": true}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE RESTRICT;

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'draft', 'disabled'));

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS public_base_url TEXT;

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE projects
SET tenant_id = (
  SELECT id
  FROM tenants
  WHERE slug = 'platform-default'
  LIMIT 1
)
WHERE tenant_id IS NULL;

ALTER TABLE projects
  ALTER COLUMN tenant_id SET NOT NULL;

INSERT INTO platform_settings (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_tenant_memberships_user ON tenant_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_tenant_id ON projects(tenant_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON access_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id, created_at DESC);
