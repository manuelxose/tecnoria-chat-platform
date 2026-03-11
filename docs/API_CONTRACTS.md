# Portal API contracts

## Public

### `GET /v1/public/platform`

- Use: load public Talkaris branding, SEO defaults and the demo widget configuration.
- Response:
  - `platform`
  - `demo`

### `POST /v1/public/access-requests`

- Use: reviewed public sign-up.
- Input:
  - `name`
  - `company`
  - `email`
  - `phone?`
  - `message?`
  - `requestedTenantName?`
- Guards:
  - stricter public email validation
  - IP rate limiting

## Auth

### `POST /v1/auth/login`
### `POST /v1/auth/logout`
### `GET /v1/auth/me`
### `POST /v1/auth/password/request-reset`
### `POST /v1/auth/password/reset`

- Cookie-based auth for the Talkaris portal.
- `login`, `request-reset` and `reset` are IP rate limited.

## Tenant console

All tenant routes require session auth and tenant membership.

### `GET /v1/portal/tenants`
### `GET /v1/portal/tenants/:tenantId/overview`
### `GET /v1/portal/tenants/:tenantId/projects`
### `POST /v1/portal/tenants/:tenantId/projects`
### `GET /v1/portal/tenants/:tenantId/projects/:projectKey/snippet`
### `GET /v1/portal/tenants/:tenantId/sources`
### `POST /v1/portal/tenants/:tenantId/sources`
### `GET /v1/portal/tenants/:tenantId/ingestions`
### `POST /v1/portal/tenants/:tenantId/ingestions`
### `GET /v1/portal/tenants/:tenantId/documents`
### `GET /v1/portal/tenants/:tenantId/leads`
### `GET /v1/portal/tenants/:tenantId/conversations`
### `GET /v1/portal/tenants/:tenantId/conversations/:conversationId/messages`
### `GET /v1/portal/tenants/:tenantId/analytics/summary?projectKey=...`

## Superadmin

All superadmin routes accept:

- session auth with `platformRole = superadmin`, or
- `Authorization: Bearer <ADMIN_BEARER_TOKEN>` for internal operations

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

## Platform settings payload

Global Talkaris fields now include:

- `brandName`
- `legalName`
- `tagline`
- `summary`
- `supportEmail`
- `websiteUrl`
- `productDomain`
- `portalBaseUrl`
- `apiBaseUrl`
- `widgetBaseUrl`
- `developedBy`
- `demoProjectKey`
- `demoSiteKey`
- `defaultLocale`
- `supportedLocales[]`
- `seoTitle`
- `seoDescription`
- `seoKeywords[]`
- `seoImageUrl`
- `organizationName`
- `contactEmail`
- `heroPoints[]`
- `featureFlags`

## Widget and legacy compatibility

### `GET /v1/widget/config/:siteKey`
### `POST /v1/widget/sessions`
### `POST /v1/widget/messages`
### `POST /v1/widget/leads`
### `POST /v1/widget/events`

- Widget embed now supports `window.TalkarisWidgetConfig`.
- Legacy aliases remain accepted during the transition.

## Pending items

- Add contract-level examples for rate-limited responses and validation errors.
- Add explicit pagination to larger list endpoints.
- Version the API docs if the backoffice is exposed to third parties.

## Recommended next step

Turn these contracts into automated smoke tests and run them after migrations and before every production deployment of `talkaris.com`.
