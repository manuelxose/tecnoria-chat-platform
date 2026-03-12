# Talkaris Platform

Talkaris is a decoupled conversational AI platform with an Angular SSR portal, a Node/Express API, an embeddable widget and a multi-tenant operating model.

## Current map

- `apps/chat-api`: public API, auth, tenant console endpoints and superadmin endpoints.
- `apps/portal`: Angular SSR portal for public marketing pages, access flows, tenant console and superadmin.
- `apps/widget`: embeddable iframe widget and async loader.
- `apps/ingest-worker`: ingestion worker for sitemap, HTML, PDF and markdown sources.
- `apps/ops-cli`: operational CLI for tenants, projects, sources, ingestions and analytics.
- `packages/core`: shared types and utilities.
- `infra`: Docker Compose, Cloudflare cutover script and Nginx template for `talkaris.com`.

## Product status

Status baseline: **March 10, 2026**.

The repository already includes:

- multi-tenant data model with `tenants`, `projects`, `users`, `tenant_memberships`, `platform_settings` and `access_requests`,
- cookie-based auth for the portal,
- Talkaris public branding defaults and demo project bootstrap,
- bilingual public routes for SEO (`es` at root, `en` under `/en`),
- SSR SEO layer with canonical, `hreflang`, JSON-LD, `robots.txt` and `sitemap.xml`,
- widget compatibility for `window.TalkarisWidgetConfig` plus legacy aliases,
- deployment templates for `talkaris.com` behind Cloudflare.

## Local setup

1. Create local env files from:
   - `apps/chat-api/.env.example`
   - `apps/portal/.env.example`
   - `apps/ingest-worker/.env.example`
   - `apps/ops-cli/.env.example`
2. Install dependencies:

```bash
npm install
```

3. Start PostgreSQL:

```bash
cd infra
docker compose up -d postgres
```

4. Run migrations:

```bash
npm run migrate -w @tecnoria-chat/chat-api
```

5. Bootstrap Talkaris defaults:

```bash
npm run cli -- create-tenant --slug platform-default --name "Talkaris Platform"
npm run cli -- seed-talkaris --tenant platform-default
SUPERADMIN_EMAIL=admin@talkaris.com \
SUPERADMIN_PASSWORD=change-me-please \
PORTAL_PUBLIC_URL=https://talkaris.com \
API_PUBLIC_URL=https://talkaris.com/api \
WIDGET_PUBLIC_URL=https://talkaris.com/widget/ \
npm run seed:talkaris -w @tecnoria-chat/chat-api
```

6. Start services:

```bash
npm run dev:api
npm run dev:widget
npm run dev:portal
npm run dev:ingest
```

## Local URLs

- Portal: `http://localhost:4103`
- Portal health: `http://localhost:4103/health`
- `robots.txt`: `http://localhost:4103/robots.txt`
- `sitemap.xml`: `http://localhost:4103/sitemap.xml`
- API: `http://localhost:4101/health`
- Widget loader: `http://localhost:4102/embed.js`

## Main commands

```bash
npm run build
npm run test
npm run dev:api
npm run dev:portal
npm run dev:widget
npm run dev:ingest
npm run cli -- seed-talkaris --tenant platform-default
npm run cli -- create-project --tenant demo --key demo --name "Demo Project"
npm run cli -- upsert-source --project demo --kind sitemap --entry https://talkaris.com/sitemap.xml
npm run cli -- analytics-summary --project demo
```

## Production target

- Public site: `https://talkaris.com/`
- API: `https://talkaris.com/api/*`
- Widget: `https://talkaris.com/widget/*`
- Canonical host: `https://talkaris.com`
- Alias: `https://www.talkaris.com` -> `301` to apex

## SEO public routes

- Spanish: `/`, `/funcionalidades`, `/integraciones`, `/casos-de-uso`, `/faq`
- English: `/en`, `/en/features`, `/en/integrations`, `/en/use-cases`, `/en/faq`
- Noindex conversion/private routes: `/solicitar-demo`, `/en/request-demo`, `/login`, `/reset-password`, `/app`, `/admin`

## Documentation

- `docs/OPERATIONS.md`
- `docs/PROJECT_STATUS.md`
- `docs/ROADMAP.md`
- `docs/ARCHITECTURE.md`
- `docs/API_CONTRACTS.md`
- `docs/DEPLOYMENT_PORTAL.md`
- `docs/TALKARIS_LAUNCH.md`

## Known constraints

- Internal workspace and database identifiers still use `tecnoria-chat` naming to avoid risky churn.
- SMTP must be provisioned outside the repo for `hello@talkaris.com`.
- Public marketing content is versioned in the portal source; there is no CMS in this phase.
