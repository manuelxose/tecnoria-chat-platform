# Talkaris architecture

## Canonical runtime

Talkaris now runs from tracked source modules only.

Primary entrypoints:

- `apps/chat-api/src/main.ts`
- `apps/chat-api/src/runtime-base.ts`
- `apps/ingest-worker/src/main.ts`
- `apps/ingest-worker/src/runtime-base.ts`
- `apps/widget/public/embed.js`
- `apps/widget/public/frame.html`
- `apps/portal/src/app/**`

No runtime source may import compiled `dist/...` artifacts.

## Main surfaces

### Chat API

- Express application
- widget runtime endpoints
- portal endpoints
- analytics endpoints
- source provisioning and ingestion queueing
- Telegram and WhatsApp channel webhooks

### Ingest worker

- consumes queued ingestion jobs
- supports `sitemap`, `html`, `pdf`, `markdown`, `api_endpoint`, `youtube`, `notion`, `gemini_file`
- writes normalized documents, versions and chunks

### Portal

- tenant console
- bot studio
- developers surface
- knowledge sources / ingestions / analytics

### Widget

- canonical loader: `embed.js`
- canonical runtime config: `window.TalkarisWidgetConfig`
- canonical frame surface: `frame.html`

## Website-first provisioning

The default public website path is:

1. create or update a project
2. call `POST /v1/portal/tenants/:tenantId/projects/:projectKey/website-integration`
3. detect sitemap or fall back to root crawl
4. create or update one canonical website source
5. queue ingestion
6. return the canonical snippet

## Shared answer pipeline

The widget and channel integrations reuse the same answer pipeline:

- widget messages call `POST /v1/widget/messages`
- channel replies are built through `buildChannelReply()`
- assistant profile, runtime policy, suggestions and CTA logic remain aligned across website widget, Telegram and WhatsApp
