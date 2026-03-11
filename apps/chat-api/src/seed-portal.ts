import bcrypt from "bcryptjs";
import { Client } from "pg";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  SUPERADMIN_EMAIL: z.string().email(),
  SUPERADMIN_PASSWORD: z.string().min(8),
  DEFAULT_TENANT_SLUG: z.string().default("platform-default"),
  DEFAULT_TENANT_NAME: z.string().default("Talkaris Platform"),
  PLATFORM_BRAND_NAME: z.string().default("Talkaris"),
  PLATFORM_LEGAL_NAME: z.string().default("Talkaris"),
  PLATFORM_TAGLINE: z.string().default("AI chat infrastructure for websites, products and operations."),
  PLATFORM_SUMMARY: z.string().default("Talkaris centralises public demo, embeddable widget, tenant operations and superadmin control in one platform."),
  PLATFORM_SUPPORT_EMAIL: z.string().email().default("hello@talkaris.com"),
  PLATFORM_WEBSITE_URL: z.string().url().default("https://talkaris.com"),
  PLATFORM_PRODUCT_DOMAIN: z.string().default("talkaris.com"),
  PORTAL_PUBLIC_URL: z.string().url().default("https://talkaris.com"),
  API_PUBLIC_URL: z.string().url().default("https://talkaris.com/api"),
  WIDGET_PUBLIC_URL: z.string().url().default("https://talkaris.com/widget/"),
  DEMO_PROJECT_KEY: z.string().default("talkaris"),
  DEMO_SITE_KEY: z.string().default("talkaris-public-site-key"),
  SEO_TITLE: z.string().default("Talkaris | AI chat platform for websites and products"),
  SEO_DESCRIPTION: z.string().default("Talkaris is the conversational AI platform for websites and applications, with embeddable widget, tenant console and central governance."),
  SEO_IMAGE_URL: z.string().url().default("https://talkaris.com/assets/talkaris-social-card.svg"),
  ORGANIZATION_NAME: z.string().default("Talkaris"),
  CONTACT_EMAIL: z.string().email().default("hello@talkaris.com"),
});

const env = envSchema.parse(process.env);

async function main(): Promise<void> {
  const client = new Client({ connectionString: env.DATABASE_URL });
  await client.connect();

  try {
    const passwordHash = await bcrypt.hash(env.SUPERADMIN_PASSWORD, 10);

    await client.query(
      `INSERT INTO tenants (slug, name, status, brand_name)
       VALUES ($1, $2, 'active', $3)
       ON CONFLICT (slug)
       DO UPDATE SET
         name = EXCLUDED.name,
         brand_name = EXCLUDED.brand_name,
         updated_at = NOW()`,
      [env.DEFAULT_TENANT_SLUG, env.DEFAULT_TENANT_NAME, env.PLATFORM_BRAND_NAME]
    );

    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, display_name, platform_role, status, email_verified_at)
       VALUES ($1, $2, 'Superadmin', 'superadmin', 'active', NOW())
       ON CONFLICT (email)
       DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         platform_role = 'superadmin',
         status = 'active',
         updated_at = NOW()
       RETURNING id`,
      [env.SUPERADMIN_EMAIL, passwordHash]
    );

    await client.query(
      `UPDATE platform_settings
       SET brand_name = $1,
           legal_name = $2,
           tagline = $3,
           summary = $4,
           support_email = $5,
           website_url = $6,
           product_domain = $7,
           portal_base_url = $8,
           api_base_url = $9,
           widget_base_url = $10,
           developed_by = 'Tecnoria',
           demo_project_key = $11,
           demo_site_key = $12,
           default_locale = 'es',
           supported_locales = '["es","en"]'::jsonb,
           seo_title = $13,
           seo_description = $14,
           seo_keywords = '["ai chat platform","chat widget","multi tenant chatbot","customer support ai","talkaris"]'::jsonb,
           seo_image_url = $15,
           organization_name = $16,
           contact_email = $17,
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
       WHERE id = 'default'`,
      [
        env.PLATFORM_BRAND_NAME,
        env.PLATFORM_LEGAL_NAME,
        env.PLATFORM_TAGLINE,
        env.PLATFORM_SUMMARY,
        env.PLATFORM_SUPPORT_EMAIL,
        env.PLATFORM_WEBSITE_URL,
        env.PLATFORM_PRODUCT_DOMAIN,
        env.PORTAL_PUBLIC_URL,
        env.API_PUBLIC_URL,
        env.WIDGET_PUBLIC_URL,
        env.DEMO_PROJECT_KEY,
        env.DEMO_SITE_KEY,
        env.SEO_TITLE,
        env.SEO_DESCRIPTION,
        env.SEO_IMAGE_URL,
        env.ORGANIZATION_NAME,
        env.CONTACT_EMAIL,
      ]
    );

    console.log(JSON.stringify({
      ok: true,
      superadminUserId: userResult.rows[0].id,
      superadminEmail: env.SUPERADMIN_EMAIL,
      defaultTenantSlug: env.DEFAULT_TENANT_SLUG,
      demoProjectKey: env.DEMO_PROJECT_KEY,
    }, null, 2));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
