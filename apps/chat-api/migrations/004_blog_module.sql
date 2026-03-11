CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  locale TEXT NOT NULL DEFAULT 'en' CHECK (locale IN ('es', 'en')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  body_html TEXT NOT NULL,
  image_url TEXT,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  author TEXT NOT NULL,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'publish')),
  seo_title TEXT,
  seo_description TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published_at
  ON blog_posts(status, published_at DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_blog_posts_locale_status_published_at
  ON blog_posts(locale, status, published_at DESC, created_at DESC);
