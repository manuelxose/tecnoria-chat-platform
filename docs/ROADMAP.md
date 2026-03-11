# Execution roadmap

## Phase 1. Data model and auth

Goal: keep a stable multi-tenant base and portal auth.

- `tenants`, `users`, `tenant_memberships`, `access_requests`, `password_reset_tokens`, `platform_settings`
- portal login, logout, `me`, request-reset and reset
- legacy bearer endpoints preserved for CLI and internal operations

Status: **implemented in functional form**

## Phase 2. Talkaris public site and SSR SEO

Goal: launch the product on `talkaris.com` with indexable public pages.

- Talkaris branding defaults
- public ES/EN route registry
- SEO service, canonical, `hreflang`, JSON-LD
- dynamic `robots.txt` and `sitemap.xml`

Status: **implemented in functional form**

## Phase 3. Tenant console

Goal: allow isolated tenant operation from the portal.

- projects and snippets
- sources and ingestions
- document, lead, conversation and analytics views

Status: **implemented in functional form**

## Phase 4. Superadmin and platform settings

Goal: control branding, access and tenants from one place.

- access request review
- tenant, user and membership management
- Talkaris platform settings including SEO fields

Status: **implemented in functional form**

## Phase 5. Launch hardening

Goal: complete the move to the real public domain.

- Cloudflare DNS and SSL cutover
- SMTP and mail DNS for `hello@talkaris.com`
- Lighthouse and search console validation
- real VPS runbook and rollback

Status: **pending**

## Pending items

- Confirm the real Cloudflare zone and certificate state for `talkaris.com`.
- Add automated smoke checks for public SEO pages and the widget path.
- Decide whether future iterations will add a CMS or keep source-controlled public content.

## Recommended next step

Focus the next iteration on Phase 5 only: production-like deployment, Cloudflare verification, SMTP delivery and final SEO validation on the live hostname.
