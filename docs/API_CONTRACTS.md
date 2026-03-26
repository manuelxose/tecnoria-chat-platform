# Portal API contracts

## Public

### `GET /v1/public/platform`

- Returns Talkaris public branding, SEO defaults and demo configuration.

### `POST /v1/public/access-requests`

- Creates a reviewed public access request.
- Rate limited by IP.

## Auth

### `POST /v1/auth/login`
### `POST /v1/auth/logout`
### `GET /v1/auth/me`
### `POST /v1/auth/password/request-reset`
### `POST /v1/auth/password/reset`

- Cookie-based portal auth.

## Tenant console

All tenant routes require session auth plus tenant membership.

### `GET /v1/portal/tenants`
### `GET /v1/portal/tenants/:tenantId/overview`
### `GET /v1/portal/tenants/:tenantId/projects`
### `POST /v1/portal/tenants/:tenantId/projects`
### `GET /v1/portal/tenants/:tenantId/projects/:projectKey`
### `PUT /v1/portal/tenants/:tenantId/projects/:projectKey`
### `GET /v1/portal/tenants/:tenantId/projects/:projectKey/snippet`
### `POST /v1/portal/tenants/:tenantId/projects/:projectKey/website-integration`
### `GET /v1/portal/tenants/:tenantId/sources`
### `POST /v1/portal/tenants/:tenantId/sources`
### `GET /v1/portal/tenants/:tenantId/ingestions`
### `POST /v1/portal/tenants/:tenantId/ingestions`
### `GET /v1/portal/tenants/:tenantId/documents`
### `GET /v1/portal/tenants/:tenantId/leads`
### `GET /v1/portal/tenants/:tenantId/conversations`
### `GET /v1/portal/tenants/:tenantId/conversations/:conversationId/messages`
### `GET /v1/portal/tenants/:tenantId/analytics/summary?projectKey=...`
### `GET /v1/portal/tenants/:tenantId/analytics/satisfaction?projectKey=...`
### `GET /v1/portal/tenants/:tenantId/analytics/rag-quality?projectKey=...&period=7d|30d|90d`
### `GET /v1/portal/tenants/:tenantId/analytics/trends?projectKey=...&period=7d|30d|90d`

## Superadmin

All superadmin routes accept session auth with `platformRole = superadmin` or the internal ops bearer token.

### `GET /v1/admin/overview`
### `GET /v1/admin/platform-settings`
### `POST /v1/admin/platform-settings`
### `GET /v1/admin/access-requests`
### `POST /v1/admin/access-requests/:id/review`
### `GET /v1/admin/tenants`
### `POST /v1/admin/tenants`
### `GET /v1/admin/users`
### `POST /v1/admin/users`
### `POST /v1/admin/memberships`

## Widget contract

### `GET /v1/widget/config/:siteKey`
### `POST /v1/widget/sessions`
### `POST /v1/widget/messages`
### `POST /v1/widget/leads`
### `POST /v1/widget/events`

- The public embed contract is canonical and unique:
  - `window.TalkarisWidgetConfig = { siteKey, apiBase, widgetBaseUrl, assetVersion? }`
- The loader only accepts `window.TalkarisWidgetConfig`.
- `POST /v1/widget/messages` returns grounded `message`, `citations`, `confidence`, optional `cta`, and optional structured `suggestions`.

## Website-first integration contract

### `POST /v1/portal/tenants/:tenantId/projects/:projectKey/website-integration`

- Request:
  - `baseUrl`
- Response:
  - `detectedMode`
  - `sourceKey`
  - `entryUrl`
  - `allowedDomains`
  - `ingestionJobId`
  - `snippet`

- Behaviour:
  - normalizes the public website URL
  - detects `robots.txt` sitemap declarations first
  - falls back to `/sitemap.xml`, then `/sitemap_index.xml`
  - if no sitemap exists, provisions a canonical `html` source rooted at the website URL
  - updates `allowedDomains`
  - queues ingestion automatically
  - returns the canonical embed snippet immediately
