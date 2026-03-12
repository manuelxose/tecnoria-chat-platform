# Platform operations

## Base flow

1. Start `postgres`, `chat-api`, `widget`, `portal` and `ingest-worker`.
2. Run chat API migrations.
3. Seed Talkaris defaults, demo project and portal superadmin.
4. Register or update projects by tenant.
5. Register sources per project.
6. Queue ingestion jobs.
7. Validate answers, leads and analytics.
8. Generate the widget snippet from tenant console and embed it in the target application.

## Core commands

```bash
npm install
npm run migrate -w @tecnoria-chat/chat-api
npm run cli -- create-tenant --slug platform-default --name "Talkaris Platform"
npm run cli -- seed-talkaris --tenant platform-default
SUPERADMIN_EMAIL=admin@talkaris.com SUPERADMIN_PASSWORD=change-me-please npm run seed:talkaris -w @tecnoria-chat/chat-api
npm run dev:api
npm run dev:widget
npm run dev:portal
npm run dev:ingest
```

## Portal access flow

1. A visitor requests a demo at `/solicitar-demo` or `/en/request-demo`.
2. Superadmin reviews `access_requests` in `/admin`.
3. On approval:
   - the tenant is created or updated,
   - the user is created or updated,
   - the `admin` membership is assigned,
   - an activation or reset token is issued.
4. The user completes activation in `/reset-password`.
5. The user enters `/app`.

## Tenant flow

1. Create or update a `project`.
2. Register a `source`.
3. Queue an `ingestion`.
4. Review indexed documents, leads, conversations and analytics.
5. Generate the widget snippet and embed it in the external application.

## Operational routes

- Portal: `http://localhost:4103`
- Portal health: `http://localhost:4103/health`
- Robots: `http://localhost:4103/robots.txt`
- Sitemap: `http://localhost:4103/sitemap.xml`
- API health: `http://localhost:4101/health`
- Widget loader: `http://localhost:4102/embed.js`
- Public platform config: `GET /v1/public/platform`
- Access requests: `POST /v1/public/access-requests`
- Auth: `/v1/auth/*`
- Tenant console: `/v1/portal/tenants/:tenantId/*`
- Superadmin: `/v1/admin/*`

## Guardrails

- Only authorised domains are indexed by each `project`.
- The widget never queries knowledge from another `project`.
- The portal only allows read or write operations inside the authorised tenant, except for `superadmin`.
- Public access, login and reset endpoints are rate limited by IP.
- Private and conversion pages are `noindex`; only public marketing pages are indexable.

## Pending items

- Validate the full flow on the real `talkaris.com` domain behind Cloudflare.
- Provision SMTP for `hello@talkaris.com` and verify delivery for approval/reset emails.
- Add end-to-end smoke automation for access request -> approval -> reset -> login.

## Recommended next step

Run a full local walkthrough with the seeded Talkaris demo: home -> request access -> approve from superadmin -> reset -> login -> create project -> generate snippet -> test widget on an external page.
