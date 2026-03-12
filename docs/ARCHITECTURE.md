# Current architecture

## Topology

```text
talkaris.com
├─ /                -> apps/portal (Angular SSR + Express)
├─ /api/*           -> apps/chat-api (Node/Express)
└─ /widget/*        -> apps/widget (static widget server)

apps/ingest-worker -> processes ingestion_jobs and writes documents/chunks
PostgreSQL         -> platform, knowledge, analytics and auth persistence
Cloudflare         -> DNS, proxy, SSL mode and cache purge
```

## Public routing model

```text
indexable ES routes:
/ /funcionalidades /integraciones /casos-de-uso /faq

indexable EN routes:
/en /en/features /en/integrations /en/use-cases /en/faq

noindex routes:
/solicitar-demo /en/request-demo /login /reset-password /app /admin
```

## Data model

```text
tenant
└─ project
   ├─ source
   │  └─ ingestion_job
   ├─ document
   │  └─ document_version
   │     └─ chunk
   ├─ conversation
   │  └─ message
   ├─ lead_event
   └─ analytics_event

user
└─ tenant_membership

platform_settings
└─ global Talkaris branding + SEO + demo widget

access_request
└─ reviewed by superadmin
```

## SSR and SEO flow

1. The browser enters `talkaris.com`.
2. `apps/portal/src/server.ts` resolves canonical host rules and private route redirects.
3. The same server serves `robots.txt` and `sitemap.xml` from the public route registry.
4. Angular SSR renders the page and the SEO service writes title, description, canonical, `hreflang`, OG, Twitter and JSON-LD.
5. Public pages fetch `GET /v1/public/platform` to resolve Talkaris branding and demo widget config.

## Widget flow

1. The external application loads `embed.js`.
2. The loader accepts `window.TalkarisWidgetConfig` plus legacy aliases.
3. The loader creates the iframe with `frame.html`.
4. The widget opens a session by `siteKey`, sends messages, leads and analytics to `chat-api`.
5. Everything remains isolated by `project_id`.

## Pending items

- Add real systemd unit templates if the final VPS rollout will not stay Docker-based.
- Add centralised observability for `portal`, `chat-api` and `ingest-worker`.
- Decide whether public content stays in source control or moves to a managed CMS later.

## Recommended next step

Validate the full topology on a staging hostname with Cloudflare in front, so canonical host logic, proxied widget traffic and SMTP flows are all exercised together.
