# Talkaris API specification

**Base URL:** `https://talkaris.com/api`

## Widget

### `GET /v1/widget/config/:siteKey`

Returns the live public widget contract for the project:

```json
{
  "projectKey": "tecnoria",
  "siteKey": "tecnoria-public-site-key",
  "botName": "Tecnoria",
  "welcomeMessage": "string",
  "starterQuestions": ["string"],
  "assistantProfile": {
    "positioningStatement": "string",
    "serviceCatalog": ["string"],
    "qualificationGoals": ["string"],
    "nextStepRules": ["string"],
    "servicePromptLibrary": ["string"]
  },
  "runtimePolicy": {
    "posture": "string",
    "scope": "string",
    "roadmapDepth": "string",
    "maxMobileSuggestions": 2,
    "maxDesktopSuggestions": 3,
    "commercialIntentThreshold": 1,
    "hideStartersAfterFirstUserMessage": true
  },
  "theme": {
    "presetKey": "indigo",
    "accentColor": "#6366f1",
    "surfaceColor": "#0f172a",
    "textColor": "#f8fafc",
    "launcherLabel": "string",
    "launcherShape": "pill",
    "buttonStyle": "glass"
  },
  "cta": {
    "primaryLabel": "string",
    "primaryUrl": "https://example.com",
    "secondaryLabel": "string",
    "secondaryUrl": "https://example.com",
    "salesKeywords": ["string"]
  },
  "promptPolicy": {
    "tone": "string",
    "outOfScopeMessage": "string"
  },
  "enableHandover": true
}
```

### `POST /v1/widget/sessions`

Request:

```json
{
  "siteKey": "string",
  "origin": "https://example.com",
  "detectedLanguage": "es"
}
```

Response:

```json
{
  "conversationId": "uuid",
  "botName": "string",
  "welcomeMessage": "string",
  "assistantProfile": {},
  "runtimePolicy": {}
}
```

### `POST /v1/widget/messages`

Request:

```json
{
  "conversationId": "uuid",
  "message": "Que servicios ofreceis"
}
```

Response is sent as SSE with one `data:` payload:

```json
{
  "type": "answer",
  "payload": {
    "message": "string",
    "citations": [
      { "title": "string", "url": "https://example.com", "snippet": "string" }
    ],
    "cta": {
      "label": "Solicitar demo",
      "url": "https://example.com"
    },
    "confidence": 0.87,
    "usedFallback": false,
    "suggestions": {
      "slot": "services",
      "items": [
        { "label": "Desarrollo software a medida", "prompt": "string", "kind": "service" }
      ]
    }
  }
}
```

### `POST /v1/widget/leads`
### `POST /v1/widget/events`
### `POST /v1/widget/conversations/:conversationId/handover`
### `POST /v1/widget/conversations/:conversationId/rating`

## Portal

### `GET /v1/portal/tenants/:tenantId/projects/:projectKey/snippet`

```json
{
  "siteKey": "string",
  "apiBase": "https://talkaris.com/api",
  "widgetBaseUrl": "https://talkaris.com/widget/",
  "snippet": "<script>...</script>"
}
```

### `POST /v1/portal/tenants/:tenantId/projects/:projectKey/website-integration`

Request:

```json
{
  "baseUrl": "https://example.com"
}
```

Response:

```json
{
  "detectedMode": "sitemap",
  "sourceKey": "website-public",
  "entryUrl": "https://example.com/sitemap.xml",
  "allowedDomains": ["example.com"],
  "ingestionJobId": "uuid",
  "snippet": "<script>...</script>"
}
```

Behaviour:

- normalizes the website URL
- detects sitemap declarations from `robots.txt`
- falls back to `/sitemap.xml`, then `/sitemap_index.xml`
- otherwise provisions a canonical `html` source
- updates project `allowedDomains`
- queues ingestion automatically

### `GET /v1/portal/tenants/:tenantId/analytics/summary?projectKey=...`

```json
{
  "projectKey": "string",
  "events": [{ "eventType": "message_sent", "total": 42 }],
  "unanswered": [{ "message": "string", "total": 3 }],
  "leads": [{ "deliveryStatus": "delivered", "total": 5 }]
}
```

### `GET /v1/portal/tenants/:tenantId/analytics/satisfaction?projectKey=...`

```json
{
  "avg": 4.2,
  "total": 17,
  "distribution": { "1": 0, "2": 1, "3": 2, "4": 5, "5": 9 },
  "recentComments": [{ "score": 5, "comment": "string", "date": "2026-03-20T09:00:00.000Z" }]
}
```

### `GET /v1/portal/tenants/:tenantId/analytics/rag-quality?projectKey=...&period=7d|30d|90d`

```json
{
  "period": "30d",
  "totalMessages": 120,
  "fallbackRate": 8.3,
  "avgConfidence": 0.81,
  "lowConfidenceCount": 4,
  "coverageScore": 92,
  "topGaps": [
    { "question": "string", "count": 3 }
  ]
}
```

### `GET /v1/portal/tenants/:tenantId/analytics/trends?projectKey=...&period=7d|30d|90d`

```json
{
  "period": "30d",
  "resolutionRate": 91,
  "handoverRate": 7,
  "avgMessagesPerConversation": 4.8,
  "avgConversationDurationMinutes": 6.1,
  "dailySeries": [
    { "date": "2026-03-01", "messages": 10, "resolved": 7, "handovers": 1 }
  ]
}
```

## Canonical embed contract

```html
<script>
  window.TalkarisWidgetConfig = {
    siteKey: "YOUR_SITE_KEY",
    apiBase: "https://talkaris.com/api",
    widgetBaseUrl: "https://talkaris.com/widget/"
  };
</script>
<script async src="https://talkaris.com/widget/embed.js"></script>
```

Only `window.TalkarisWidgetConfig` is supported.
