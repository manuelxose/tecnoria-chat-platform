# Platform operations

## Canonical runtime

Talkaris boots from tracked source only:

- `apps/chat-api/src/main.ts`
- `apps/chat-api/src/runtime-base.ts`
- `apps/ingest-worker/src/main.ts`
- `apps/ingest-worker/src/runtime-base.ts`

No source file may import `dist/...` artifacts.

## Base flow

1. Start `postgres`, `chat-api`, `widget`, `portal` and `ingest-worker`.
2. Run chat API migrations.
3. Seed Talkaris defaults and a portal superadmin.
4. Create or update the tenant project.
5. Run `website-integration` for the public site.
6. Validate queued ingestion, indexed documents, widget answers and analytics.
7. Copy the canonical widget snippet into the target website.

## Core commands

```bash
npm install
npm run migrate -w @tecnoria-chat/chat-api
SUPERADMIN_EMAIL=admin@talkaris.com SUPERADMIN_PASSWORD=change-me-please npm run seed:talkaris -w @tecnoria-chat/chat-api
npm run build -w @tecnoria-chat/chat-api
npm run build -w @tecnoria-chat/ingest-worker
npm run build -w @tecnoria-chat/portal
npm run build -w @tecnoria-chat/widget
npm run dev:api
npm run dev:portal
npm run dev:widget
npm run dev:ingest
```

## Tenant onboarding

The default production flow is website-first:

1. Create the bot/project in the portal.
2. Call `POST /v1/portal/tenants/:tenantId/projects/:projectKey/website-integration`.
3. Let Talkaris detect sitemap or fall back to root crawl.
4. Review the queued ingestion job.
5. Embed the returned snippet.

Advanced sources remain supported under Knowledge Sources, but they are no longer the primary onboarding path for public websites.

## Operational routes

- Portal: `http://localhost:4103`
- Portal health: `http://localhost:4103/health`
- API health: `http://localhost:4101/health`
- Widget loader: `http://localhost:4102/embed.js`
- Public platform config: `GET /v1/public/platform`
- Auth: `/v1/auth/*`
- Tenant console: `/v1/portal/tenants/:tenantId/*`
- Superadmin: `/v1/admin/*`

## Guardrails

- The website integration flow only accepts public `http(s)` URLs.
- `allowedDomains` are inferred from the website host and persisted on the project.
- The widget only uses `window.TalkarisWidgetConfig`.
- Analytics queries read from the current schema: `analytics_events.payload`, `messages`, `lead_events`, `conversation_ratings`, `handover_events`.

## Verification

Run these before a production deployment:

```bash
npm run build -w @tecnoria-chat/chat-api
npm run build -w @tecnoria-chat/ingest-worker
npm run build -w @tecnoria-chat/portal
npm run build -w @tecnoria-chat/widget
node --import tsx --test src/design-governance.test.ts
```
