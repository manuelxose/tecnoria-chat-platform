# Project status

Cut date: **March 10, 2026**

## Executive summary

The platform now has a Talkaris public surface, SSR SEO support, multi-tenant operations, portal auth, widget compatibility and deployment material for `talkaris.com`.

## Status by subsystem

| Subsystem | Status | Implemented | Main gap | Depends on |
| --- | --- | --- | --- | --- |
| `chat-api` | In progress | Widget endpoints, auth, tenant console, superadmin, Talkaris defaults, rate limiting | More route-level API coverage | PostgreSQL, SMTP |
| `widget` | In progress | Loader, iframe, Talkaris alias config, legacy compatibility | Real production embed validation on external apps | `chat-api` |
| `ingest-worker` | In progress | Sitemap/HTML/PDF/markdown ingestion and Talkaris crawler UA | More observability and retry tuning | PostgreSQL |
| `ops-cli` | In progress | Create tenant/project, sources, ingestion, analytics, `seed-talkaris` | More global portal utilities | `chat-api` |
| `portal` | In progress | SSR public pages, ES/EN content, SEO service, access flow, tenant console, superadmin | Visual hardening and richer UX polish | `chat-api`, widget |
| SEO | In progress | Canonical, `hreflang`, JSON-LD, dynamic `robots.txt` and `sitemap.xml` | Lighthouse run on real domain and Search Console submission | `portal`, Cloudflare |
| Deployment | Partial | Docker Compose, Nginx template, Cloudflare cutover script | Real VPS cutover and systemd verification | VPS, Cloudflare |

## Implemented now

- Talkaris branding defaults in API, seed and portal.
- SEO-aware public route registry for Spanish and English.
- Dynamic `robots.txt` and `sitemap.xml` from the SSR server.
- `TalkarisWidgetConfig` support with legacy widget aliases preserved.
- Superadmin fields for SEO title, description, keywords, image, locales and contact.

## Open risks

- SMTP is still an external prerequisite for `hello@talkaris.com`.
- The real `talkaris.com` zone and origin certificate must be validated before production cutover.
- Internal workspace names remain `tecnoria-chat`; this is intentional and not a launch blocker.

## Pending items

- Run migration `003_talkaris_launch.sql` on the real target database.
- Validate the public site, API and widget through the actual Cloudflare-hosted domain.
- Submit the sitemap to Google Search Console and Bing Webmaster after DNS cutover.

## Recommended next step

Promote the stack to a staging hostname that mirrors `talkaris.com`, then execute the full public, auth and widget walkthrough against that environment before the final DNS switch.
