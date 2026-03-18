# Talkaris — API Specification

**Base URL:** `https://api.talkaris.com`
**Versión:** v1
**Auth:** Cookie `chat_console_session` (JWT) para portal users. Header `X-Talkaris-Key: tk_live_xxx` para API keys (v1.5+). Header `Authorization: Bearer xxx` para Ops/Admin.

---

## Convenciones

### Respuestas de Error

```json
{ "error": "Mensaje de error legible" }
```

Códigos HTTP:
- `400` — Validación fallida (Zod)
- `401` — No autenticado
- `403` — Sin permiso (rol insuficiente)
- `404` — Recurso no encontrado
- `429` — Rate limit excedido
- `500` — Error interno del servidor

### Paginación
```
?page=1&limit=50
Response: { data: [], total: number, page: number, limit: number }
```

### Timestamps
Todos los timestamps en ISO 8601 UTC: `"2026-03-12T18:00:00.000Z"`

---

## 1. Health

### GET /health
**Auth:** Ninguna
**Response:**
```json
{ "ok": true, "db": "2026-03-12T18:00:00.000Z" }
```

---

## 2. Public Endpoints

### GET /v1/public/platform
**Auth:** Ninguna
**Descripción:** Datos de branding público para el sitio de marketing.
**Response:**
```json
{
  "brandName": "Talkaris",
  "tagline": "...",
  "supportEmail": "hola@talkaris.com",
  "heroPoints": [],
  "featureFlags": { "publicAccessRequests": true },
  "demoProjectKey": "demo",
  "demoSiteKey": "demo-key"
}
```

---

### GET /v1/public/blog
**Auth:** Ninguna
**Query:** `?locale=es|en&page=1&limit=10`
**Response:**
```json
{
  "posts": [
    {
      "id": "uuid",
      "slug": "...",
      "locale": "es",
      "title": "...",
      "summary": "...",
      "imageUrl": "...",
      "author": "...",
      "category": "...",
      "tags": [],
      "publishedAt": "..."
    }
  ],
  "total": 42
}
```

---

### GET /v1/public/blog/:slug
**Auth:** Ninguna
**Response:** Post completo con `bodyHtml`

---

### POST /v1/public/access-requests
**Auth:** Ninguna | **Rate:** 5/15min por IP
**Body:**
```json
{
  "name": "string",
  "company": "string",
  "email": "business@example.com",
  "phone": "string?",
  "message": "string?",
  "requestedTenantName": "string?"
}
```
**Response:** `{ "id": "uuid" }`

---

## 3. Widget Endpoints

### GET /v1/widget/config/:siteKey
**Auth:** Ninguna (validación de origen por `allowedDomains`)
**Response:**
```json
{
  "projectKey": "string",
  "botName": "string",
  "welcomeMessage": "string",
  "language": "es|en",
  "widgetTheme": {
    "accentColor": "#1c7a67",
    "surfaceColor": "#ffffff",
    "textColor": "#081424",
    "launcherLabel": "¿Necesitas ayuda?"
  },
  "ctaConfig": {
    "primaryLabel": "Solicitar demo",
    "primaryUrl": "https://...",
    "secondaryLabel": "Ver precios",
    "secondaryUrl": "https://...",
    "salesKeywords": ["precio", "contratar", "demo"]
  },
  "promptPolicy": {
    "tone": "profesional",
    "guardrails": "No dar información de precios",
    "outOfScopeMessage": "No tengo información sobre eso.",
    "disallowPricing": true
  },
  "showRatingPrompt": false
}
```

---

### POST /v1/widget/sessions
**Auth:** Ninguna | Validación de dominio
**Body:**
```json
{ "siteKey": "string", "origin": "https://example.com", "userAgent": "string?" }
```
**Response:**
```json
{ "conversationId": "uuid" }
```

---

### POST /v1/widget/messages
**Auth:** Ninguna | Validación de dominio
**Body:**
```json
{
  "conversationId": "uuid",
  "siteKey": "string",
  "message": "string",
  "detectedLanguage": "es|en?"
}
```
**Response:**
```json
{
  "message": "string",
  "citations": [
    { "title": "string", "url": "https://...", "snippet": "string" }
  ],
  "cta": {
    "show": true,
    "primaryLabel": "Solicitar demo",
    "primaryUrl": "https://...",
    "secondaryLabel": "Ver precios",
    "secondaryUrl": "https://..."
  } | null,
  "confidence": 0.87,
  "usedFallback": false
}
```

---

### POST /v1/widget/leads
**Auth:** Ninguna | Validación de dominio
**Body:**
```json
{
  "conversationId": "uuid?",
  "siteKey": "string",
  "name": "string?",
  "email": "string?",
  "company": "string?",
  "phone": "string?",
  "message": "string?",
  "service1": "string?",
  "service2": "string?"
}
```
**Response:** `{ "id": "uuid" }`

---

### POST /v1/widget/events
**Auth:** Ninguna
**Body:**
```json
{
  "conversationId": "uuid?",
  "siteKey": "string",
  "eventType": "widget_opened|message_sent|response_served|citation_clicked|cta_clicked|lead_submitted|no_answer|fallback",
  "payload": {}
}
```
**Response:** `{ "ok": true }`

---

### POST /v1/widget/conversations/:id/rating ⭐ v1.5
**Auth:** Ninguna | Validación de dominio
**Body:**
```json
{ "score": 1|2|3|4|5, "comment": "string?" }
```
**Response:** `{ "ok": true }`

---

### POST /v1/widget/conversations/:id/handover ⭐ v2
**Auth:** Ninguna
**Body:**
```json
{ "siteKey": "string", "reason": "string?" }
```
**Response:** `{ "handoverId": "uuid", "estimatedWait": "string?" }`

---

## 4. Authentication

### POST /v1/auth/login
**Auth:** Ninguna | **Rate:** 10/15min
**Body:**
```json
{ "email": "string", "password": "string" }
```
**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "string",
    "displayName": "string",
    "platformRole": "superadmin|member",
    "status": "active"
  }
}
```
**Side effect:** Set-Cookie `chat_console_session` httpOnly; SameSite=Lax; TTL 8h

---

### POST /v1/auth/logout
**Auth:** JWT cookie
**Response:** `{ "ok": true }` — Borra cookie

---

### GET /v1/auth/me
**Auth:** JWT cookie
**Response:**
```json
{
  "id": "uuid",
  "email": "string",
  "displayName": "string",
  "platformRole": "superadmin|member",
  "status": "string",
  "memberships": [
    { "tenantId": "uuid", "tenantName": "string", "role": "admin|editor|viewer" }
  ]
}
```

---

### POST /v1/auth/password/request-reset
**Auth:** Ninguna | **Rate:** 5/15min
**Body:** `{ "email": "string" }`
**Response:** `{ "ok": true }` (siempre, para no revelar emails)

---

### POST /v1/auth/password/reset
**Auth:** Ninguna | **Rate:** 10/15min
**Body:** `{ "token": "string", "password": "string" }`
**Response:** `{ "ok": true }`

---

## 5. Portal — Tenants

### GET /v1/portal/tenants
**Auth:** JWT cookie
**Response:**
```json
{
  "tenants": [
    {
      "id": "uuid",
      "slug": "string",
      "name": "string",
      "status": "active|pending|disabled",
      "role": "admin|editor|viewer"
    }
  ]
}
```

---

### GET /v1/portal/tenants/:tenantId/overview
**Auth:** JWT | Requiere membresía en tenant
**Response:**
```json
{
  "stats": {
    "projects": 3,
    "sources": 12,
    "documents": 4840,
    "leads": 87,
    "conversations": 1204,
    "unanswered": 23,
    "pendingJobs": 1
  }
}
```

---

## 6. Portal — Projects (Bots)

### GET /v1/portal/tenants/:tenantId/projects
**Auth:** JWT | Membresía
**Response:** `{ "projects": [ProjectSummary] }`

---

### POST /v1/portal/tenants/:tenantId/projects
**Auth:** JWT | Role: admin|editor
**Body:**
```json
{
  "projectKey": "my-bot",
  "name": "Mi Asistente",
  "siteKey": "abc123",
  "language": "es",
  "allowedDomains": ["example.com"],
  "botName": "Asistente",
  "welcomeMessage": "¡Hola! ¿En qué puedo ayudarte?",
  "status": "active|draft|disabled",
  "promptPolicy": {
    "tone": "amigable",
    "guardrails": "No revelar precios internos",
    "outOfScopeMessage": "No tengo esa información.",
    "disallowPricing": false
  },
  "ctaConfig": {
    "primaryLabel": "Solicitar demo",
    "primaryUrl": "https://...",
    "secondaryLabel": "Ver precios",
    "secondaryUrl": "https://...",
    "salesKeywords": ["precio", "demo"]
  },
  "widgetTheme": {
    "accentColor": "#1c7a67",
    "launcherLabel": "¿Necesitas ayuda?"
  },
  "leadSink": {
    "mode": "webhook",
    "webhookUrl": "https://...",
    "secretHeaderName": "x-talkaris-secret"
  }
}
```
**Response:** `{ "project": Project }`

---

### GET /v1/portal/tenants/:tenantId/projects/:projectKey/snippet
**Auth:** JWT | Membresía
**Response:**
```json
{
  "snippet": "<script src=\"...\">...</script>",
  "siteKey": "abc123"
}
```

---

### GET /v1/portal/tenants/:tenantId/projects/:projectKey/ai-config ⭐ v2
**Auth:** JWT | Membresía
**Response:**
```json
{
  "provider": "openai",
  "model": "gpt-4o-mini",
  "temperature": 0.3,
  "maxTokens": 1024,
  "systemPromptAdditions": null
}
```

---

### PUT /v1/portal/tenants/:tenantId/projects/:projectKey/ai-config ⭐ v2
**Auth:** JWT | Role: admin
**Body:** Mismos campos que response de GET

---

### POST /v1/portal/tenants/:tenantId/projects/:projectKey/test-chat ⭐ v1.5
**Auth:** JWT | Membresía
**Body:**
```json
{
  "message": "¿Cuánto cuesta el plan pro?",
  "conversationHistory": [
    { "role": "user", "content": "Hola" },
    { "role": "assistant", "content": "¡Hola! ¿En qué puedo ayudarte?" }
  ]
}
```
**Response:** Igual que `/v1/widget/messages` pero sin persistir en DB.

---

## 7. Portal — Sources (Fuentes de Conocimiento)

### GET /v1/portal/tenants/:tenantId/sources
**Auth:** JWT | Membresía
**Response:** `{ "sources": [Source] }`

---

### POST /v1/portal/tenants/:tenantId/sources
**Auth:** JWT | Role: admin|editor
**Body:**
```json
{
  "projectId": "uuid",
  "sourceKey": "docs-sitemap",
  "kind": "sitemap|html|pdf|markdown|youtube|api_endpoint|notion|zendesk|google_drive",
  "entryUrl": "https://example.com/sitemap.xml",
  "includePatterns": ["https://example.com/docs/*"],
  "excludePatterns": ["https://example.com/docs/internal/*"],
  "allowedDomains": ["example.com"],
  "visibility": "public|private",
  "defaultCategory": "Documentation",
  "active": true,
  "credentials": {
    "apiKey": "...",
    "token": "..."
  }
}
```

**Tipos de fuente adicionales (v2):**

- `youtube`: `entryUrl` = URL del canal o playlist. Extrae transcripts via YouTube Data API.
- `api_endpoint`: `entryUrl` = URL de la API. `credentials.headers` = headers custom.
- `notion`: `credentials.integrationToken` + `entryUrl` = URL de la database o page.
- `zendesk`: `entryUrl` = `https://{subdomain}.zendesk.com`. `credentials.email` + `credentials.apiToken`.
- `google_drive`: `credentials.serviceAccountKey` (JSON). `entryUrl` = folder ID.

---

## 8. Portal — Ingestion Jobs

### GET /v1/portal/tenants/:tenantId/ingestions
**Auth:** JWT | Membresía
**Query:** `?status=queued|running|done|failed&page=1&limit=50`
**Response:** `{ "jobs": [IngestionJob], "counts": { queued: 0, running: 1, done: 45, failed: 2 } }`

---

### POST /v1/portal/tenants/:tenantId/ingestions
**Auth:** JWT | Role: admin|editor
**Body:**
```json
{ "sourceId": "uuid" }
```
**Response:** `{ "jobId": "uuid" }`

---

### GET /v1/portal/tenants/:tenantId/documents
**Auth:** JWT | Membresía
**Query:** `?projectKey=&search=&docType=&page=1&limit=50`
**Response:** `{ "documents": [DocumentSummary], "total": number }`

---

### GET /v1/portal/tenants/:tenantId/ingestion-schedules ⭐ v1.5
**Auth:** JWT | Membresía
**Response:** `{ "schedules": [IngestionSchedule] }`

---

### POST /v1/portal/tenants/:tenantId/ingestion-schedules ⭐ v1.5
**Auth:** JWT | Role: admin|editor
**Body:**
```json
{
  "name": "Re-ingesta diaria docs",
  "sourceIds": ["uuid1", "uuid2"],
  "cronExpr": "0 8 * * *",
  "active": true
}
```

---

### PUT/DELETE /v1/portal/tenants/:tenantId/ingestion-schedules/:id ⭐ v1.5

---

## 9. Portal — Analytics

### GET /v1/portal/tenants/:tenantId/analytics/summary
**Auth:** JWT | Membresía
**Query:** `?projectKey=&period=7d|30d|90d`
**Response:**
```json
{
  "events": {
    "widget_opened": 230,
    "message_sent": 856,
    "response_served": 843,
    "citation_clicked": 124,
    "cta_clicked": 67,
    "lead_submitted": 12,
    "no_answer": 34,
    "fallback": 22
  },
  "unansweredQuestions": [
    { "question": "¿Tienen integración con SAP?", "count": 8 }
  ],
  "leadDeliveryStatus": {
    "pending": 2,
    "delivered": 8,
    "failed": 2
  }
}
```

---

### GET /v1/portal/tenants/:tenantId/analytics/satisfaction ⭐ v1.5
**Auth:** JWT | Membresía
**Query:** `?projectKey=&period=7d|30d|90d`
**Response:**
```json
{
  "avg": 4.2,
  "total": 87,
  "distribution": { "1": 3, "2": 5, "3": 8, "4": 28, "5": 43 },
  "recentComments": [
    { "score": 5, "comment": "Muy útil, respondió exactamente lo que necesitaba", "date": "..." }
  ]
}
```

---

### GET /v1/portal/tenants/:tenantId/analytics/rag-quality ⭐ v2
**Auth:** JWT | Membresía
**Response:**
```json
{
  "fallbackRate": 0.08,
  "avgConfidence": 0.82,
  "lowConfidenceCount": 45,
  "coverageScore": 91,
  "topGaps": [
    "¿Tienen integración con SAP?",
    "¿Pueden exportar a Excel?"
  ],
  "unansweredClusters": [
    { "topic": "Integraciones ERP", "count": 23, "examples": ["..."] }
  ]
}
```

---

## 10. Portal — Conversations

### GET /v1/portal/tenants/:tenantId/conversations
**Auth:** JWT | Membresía
**Query:** `?projectKey=&page=1&limit=50`
**Response:** `{ "conversations": [ConversationSummary], "total": number }`

---

### GET /v1/portal/tenants/:tenantId/conversations/:conversationId/messages
**Auth:** JWT | Membresía
**Response:**
```json
{
  "conversation": { "id": "uuid", "origin": "...", "createdAt": "..." },
  "messages": [
    {
      "id": "uuid",
      "role": "user|assistant",
      "body": "...",
      "citations": [],
      "confidence": 0.87,
      "createdAt": "..."
    }
  ]
}
```

---

## 11. Portal — Leads

### GET /v1/portal/tenants/:tenantId/leads
**Auth:** JWT | Membresía
**Query:** `?projectKey=&status=&page=1&limit=50`
**Response:** `{ "leads": [LeadEvent], "total": number }`

---

## 12. Portal — Members ⭐ v1.5

### GET /v1/portal/tenants/:tenantId/members
**Auth:** JWT | Membresía
**Response:**
```json
{
  "members": [
    {
      "userId": "uuid",
      "email": "...",
      "displayName": "...",
      "role": "admin|editor|viewer",
      "status": "active|pending",
      "joinedAt": "..."
    }
  ]
}
```

---

### PUT /v1/portal/tenants/:tenantId/members/:userId
**Auth:** JWT | Role: admin
**Body:** `{ "role": "admin|editor|viewer" }`

---

### DELETE /v1/portal/tenants/:tenantId/members/:userId
**Auth:** JWT | Role: admin

---

### POST /v1/portal/tenants/:tenantId/invitations ⭐ v1.5
**Auth:** JWT | Role: admin
**Body:**
```json
{ "email": "nuevo@example.com", "role": "editor" }
```
**Efecto:** Crea user con `status=pending`, envía email con link de setup de contraseña.

---

## 13. Portal — API Keys ⭐ v1.5

### GET /v1/portal/tenants/:tenantId/api-keys
**Auth:** JWT | Role: admin
**Response:**
```json
{
  "apiKeys": [
    {
      "id": "uuid",
      "name": "Integración HubSpot",
      "prefix": "tk_live_abc1...",
      "scopes": ["leads:read", "analytics:read"],
      "lastUsedAt": "...",
      "expiresAt": null,
      "createdAt": "..."
    }
  ]
}
```
> La key completa solo se muestra al crear, nunca después.

---

### POST /v1/portal/tenants/:tenantId/api-keys ⭐ v1.5
**Auth:** JWT | Role: admin
**Body:**
```json
{
  "name": "Integración HubSpot",
  "scopes": ["leads:read", "analytics:read"],
  "expiresAt": "2027-01-01T00:00:00Z"
}
```
**Response:**
```json
{
  "id": "uuid",
  "key": "tk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "name": "...",
  "scopes": [],
  "createdAt": "..."
}
```

---

### DELETE /v1/portal/tenants/:tenantId/api-keys/:keyId ⭐ v1.5
**Auth:** JWT | Role: admin

---

## 14. Portal — Webhooks ⭐ v1.5

### GET /v1/portal/tenants/:tenantId/webhooks
**Auth:** JWT | Membresía
**Response:** `{ "webhooks": [Webhook] }`

---

### POST /v1/portal/tenants/:tenantId/webhooks ⭐ v1.5
**Body:**
```json
{
  "url": "https://example.com/hook",
  "events": ["lead.created", "ingestion.failed"],
  "description": "Notificaciones al CRM"
}
```
**Response incluye:** `secret` (mostrado UNA vez, formato `whsec_xxx`)

---

### PUT /v1/portal/tenants/:tenantId/webhooks/:webhookId ⭐ v1.5
### DELETE /v1/portal/tenants/:tenantId/webhooks/:webhookId ⭐ v1.5

### POST /v1/portal/tenants/:tenantId/webhooks/:webhookId/test ⭐ v1.5
Envía evento de prueba `webhook.test` al endpoint configurado.
**Response:** `{ "statusCode": 200, "responseBody": "...", "latencyMs": 45 }`

---

## 15. Portal — Ingestion Schedules ⭐ v1.5

*(Ver sección 8 arriba)*

---

## 16. Portal — Notification Preferences ⭐ v1.5

### GET /v1/portal/tenants/:tenantId/notification-prefs
### PUT /v1/portal/tenants/:tenantId/notification-prefs

**Body/Response:**
```json
{
  "emailRecipients": ["admin@example.com"],
  "leadCreated": true,
  "ingestionFailed": true,
  "lowConfidenceAlert": false,
  "lowConfidenceThreshold": 0.3,
  "digestFrequency": "none|daily|weekly"
}
```

---

## 17. Portal — Handovers ⭐ v2

### GET /v1/portal/tenants/:tenantId/handovers
**Query:** `?status=queued|claimed|resolved`
**Response:** `{ "handovers": [HandoverEvent] }`

### PUT /v1/portal/tenants/:tenantId/handovers/:id/claim ⭐ v2
### PUT /v1/portal/tenants/:tenantId/handovers/:id/resolve ⭐ v2

---

## 18. Portal — Integrations ⭐ v2

### GET /v1/portal/tenants/:tenantId/integrations
### DELETE /v1/portal/tenants/:tenantId/integrations/:integrationId

### POST /v1/portal/tenants/:tenantId/integrations/hubspot/connect ⭐ v2
Redirige a OAuth de HubSpot

### GET /v1/portal/tenants/:tenantId/integrations/hubspot/callback ⭐ v2
Recibe código OAuth, intercambia por tokens

---

## 19. Portal — Brand (Whitelabeling) ⭐ v2

### GET /v1/portal/tenants/:tenantId/brand
### PUT /v1/portal/tenants/:tenantId/brand

**Body/Response:**
```json
{
  "widgetLogoUrl": "https://...",
  "widgetPrimaryColor": "#1c7a67",
  "widgetRemoveBranding": false,
  "widgetCustomDomain": null
}
```

---

## 20. Portal — Exports ⭐ v1.5

### GET /v1/portal/tenants/:tenantId/export/conversations
### GET /v1/portal/tenants/:tenantId/export/leads
### GET /v1/portal/tenants/:tenantId/export/analytics

**Query:** `?from=2026-01-01&to=2026-03-12&format=csv|json&projectKey=`
**Response:** File download con `Content-Disposition: attachment`

---

## 21. Admin Endpoints

### GET /v1/admin/overview
**Auth:** Bearer token O JWT superadmin
**Response:**
```json
{
  "stats": {
    "tenants": 12,
    "users": 48,
    "projects": 35,
    "conversations": 15420,
    "leads": 892,
    "pendingRequests": 3
  },
  "recentRequests": []
}
```

---

### GET /v1/admin/platform-settings
### POST /v1/admin/platform-settings
**Auth:** Bearer token

---

### GET /v1/admin/access-requests
### POST /v1/admin/access-requests/:id/review
**Body:** `{ "action": "accepted|rejected", "notes": "string?" }`
Cuando `accepted`: crea tenant + user + membership automáticamente.

---

### GET /v1/admin/tenants
### POST /v1/admin/tenants
**Body:** `{ "slug": "string", "name": "string", "brandName": "string?" }`

---

### GET /v1/admin/users
### POST /v1/admin/users
**Body:** `{ "email": "string", "displayName": "string", "platformRole": "member|superadmin", "tempPassword": "string" }`

---

### POST /v1/admin/memberships
**Body:** `{ "userId": "uuid", "tenantId": "uuid", "role": "admin|editor|viewer" }`

---

### POST /v1/admin/projects
### POST /v1/admin/sources
### POST /v1/admin/ingestions
### GET /v1/admin/ingestions/:id
### POST /v1/admin/evals
### GET /v1/admin/analytics/summary

---

## 22. Integrations (Webhooks externos)

### POST /v1/integrations/webhooks/leads
**Auth:** Header `x-shared-secret: [LEAD_WEBHOOK_SHARED_SECRET]`
**Body:** Lead payload externo
**Response:** `{ "ok": true }`

---

## 23. Ops Endpoints (Blog)

### POST /v1/ops/blog
### PUT /v1/ops/blog/:id
### DELETE /v1/ops/blog/:id
**Auth:** Bearer `AUCTORIO_PUBLISHER_TOKEN`

---

## Modelos de Datos de Referencia

### Project
```typescript
{
  id: string;
  tenantId: string;
  projectKey: string;
  name: string;
  siteKey: string;
  language: string;
  languageMode: 'fixed' | 'auto';        // v2
  allowedDomains: string[];
  botName: string;
  welcomeMessage: string;
  promptPolicy: PromptPolicy;
  ctaConfig: CtaConfig;
  widgetTheme: WidgetTheme;
  leadSink: LeadSink;
  aiConfig: AiConfig | null;              // v2
  showRatingPrompt: boolean;              // v1.5
  status: 'active' | 'draft' | 'disabled';
  createdAt: string;
  updatedAt: string;
}
```

### IngestionJob
```typescript
{
  id: string;
  projectId: string;
  sourceId: string;
  status: 'queued' | 'running' | 'done' | 'failed';
  requestedBy: string;
  summary: { documentsProcessed: number; chunksCreated: number; errors: number } | null;
  errorText: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}
```

### ConversationSummary
```typescript
{
  id: string;
  projectKey: string;
  origin: string;
  messageCount: number;
  hasRating: boolean;
  rating: number | null;
  createdAt: string;
}
```

### ApiKey
```typescript
{
  id: string;
  tenantId: string;
  name: string;
  prefix: string;       // Primeros 12 chars de la key
  scopes: ApiScope[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}
type ApiScope = 'chat:read' | 'ingestion:write' | 'analytics:read' | 'leads:read';
```

### Webhook
```typescript
{
  id: string;
  tenantId: string;
  url: string;
  events: WebhookEvent[];
  description: string;
  active: boolean;
  createdAt: string;
}
type WebhookEvent =
  | 'lead.created'
  | 'conversation.started'
  | 'message.unanswered'
  | 'ingestion.completed'
  | 'ingestion.failed'
  | 'handover.requested';
```

---

## Changelog

| Versión | Fecha | Cambio |
|---------|-------|--------|
| 1.0 | 2026-03-12 | Documentación de los 54 endpoints actuales |
| 1.1 | 2026-03-12 | Spec de 30 endpoints planificados v1.5 y v2 |
