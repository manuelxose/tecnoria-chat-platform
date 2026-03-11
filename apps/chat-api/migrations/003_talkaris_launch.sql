ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS default_locale TEXT NOT NULL DEFAULT 'es';

ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS supported_locales JSONB NOT NULL DEFAULT '["es","en"]'::jsonb;

ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS seo_title TEXT NOT NULL DEFAULT 'Talkaris | AI chat platform for websites and products';

ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS seo_description TEXT NOT NULL DEFAULT 'Talkaris is the conversational AI platform for websites and applications, with embeddable widget, tenant console and central governance.';

ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS seo_keywords JSONB NOT NULL DEFAULT '["ai chat platform","chat widget","multi tenant chatbot","customer support ai","talkaris"]'::jsonb;

ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS seo_image_url TEXT NOT NULL DEFAULT 'https://talkaris.com/assets/talkaris-social-card.svg';

ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS organization_name TEXT NOT NULL DEFAULT 'Talkaris';

ALTER TABLE platform_settings
  ADD COLUMN IF NOT EXISTS contact_email TEXT NOT NULL DEFAULT 'hello@talkaris.com';

ALTER TABLE platform_settings
  ALTER COLUMN brand_name SET DEFAULT 'Talkaris';

ALTER TABLE platform_settings
  ALTER COLUMN legal_name SET DEFAULT 'Talkaris';

ALTER TABLE platform_settings
  ALTER COLUMN tagline SET DEFAULT 'AI chat infrastructure for websites, products and operations.';

ALTER TABLE platform_settings
  ALTER COLUMN summary SET DEFAULT 'Talkaris centralises public demo, embeddable widget, tenant operations and superadmin control in one platform.';

ALTER TABLE platform_settings
  ALTER COLUMN support_email SET DEFAULT 'hello@talkaris.com';

ALTER TABLE platform_settings
  ALTER COLUMN website_url SET DEFAULT 'https://talkaris.com';

ALTER TABLE platform_settings
  ALTER COLUMN product_domain SET DEFAULT 'talkaris.com';

ALTER TABLE platform_settings
  ALTER COLUMN portal_base_url SET DEFAULT 'https://talkaris.com';

ALTER TABLE platform_settings
  ALTER COLUMN api_base_url SET DEFAULT 'https://talkaris.com/api';

ALTER TABLE platform_settings
  ALTER COLUMN widget_base_url SET DEFAULT 'https://talkaris.com/widget/';

ALTER TABLE platform_settings
  ALTER COLUMN demo_project_key SET DEFAULT 'talkaris';

ALTER TABLE platform_settings
  ALTER COLUMN demo_site_key SET DEFAULT 'talkaris-public-site-key';

UPDATE platform_settings
SET brand_name = 'Talkaris',
    legal_name = 'Talkaris',
    tagline = 'AI chat infrastructure for websites, products and operations.',
    summary = 'Talkaris centralises public demo, embeddable widget, tenant operations and superadmin control in one platform.',
    support_email = 'hello@talkaris.com',
    website_url = 'https://talkaris.com',
    product_domain = 'talkaris.com',
    portal_base_url = CASE
      WHEN portal_base_url LIKE 'http://localhost:%' THEN portal_base_url
      ELSE 'https://talkaris.com'
    END,
    api_base_url = CASE
      WHEN api_base_url LIKE 'http://localhost:%' THEN api_base_url
      ELSE 'https://talkaris.com/api'
    END,
    widget_base_url = CASE
      WHEN widget_base_url LIKE 'http://localhost:%' THEN widget_base_url
      ELSE 'https://talkaris.com/widget/'
    END,
    developed_by = 'Tecnoria',
    demo_project_key = 'talkaris',
    demo_site_key = 'talkaris-public-site-key',
    default_locale = 'es',
    supported_locales = '["es","en"]'::jsonb,
    seo_title = 'Talkaris | AI chat platform for websites and products',
    seo_description = 'Talkaris is the conversational AI platform for websites and applications, with embeddable widget, tenant console and central governance.',
    seo_keywords = '["ai chat platform","chat widget","multi tenant chatbot","customer support ai","talkaris"]'::jsonb,
    seo_image_url = 'https://talkaris.com/assets/talkaris-social-card.svg',
    organization_name = 'Talkaris',
    contact_email = 'hello@talkaris.com',
    hero_points = '[
      "Public landing with live widget demo",
      "Independent tenant consoles by client or product",
      "Central superadmin governance"
    ]'::jsonb,
    feature_flags = '{
      "publicAccessRequests": true,
      "tenantConsole": true,
      "superadmin": true,
      "seoLanding": true
    }'::jsonb,
    updated_at = NOW()
WHERE id = 'default';
