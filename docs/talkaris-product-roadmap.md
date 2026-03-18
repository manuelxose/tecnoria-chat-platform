# Talkaris — Product Roadmap

## Visión del Producto

Talkaris es una plataforma multi-tenant de IA conversacional que permite a empresas desplegar chatbots de conocimiento en sus sitios web y productos. La visión es convertirse en la plataforma de referencia para empresas hispanohablantes que quieren ofrecer soporte, captación de leads y autoservicio con IA — con la calidad técnica de Linear o Vercel y la simplicidad de Chatbase.

---

## Posicionamiento Competitivo

| Dimensión | Talkaris Hoy | Target v2 |
|-----------|-------------|-----------|
| Facilidad de uso | Media | Alta (setup en <10min) |
| Precisión RAG | Alta | Muy Alta (métricas RAG públicas) |
| Canales | Web widget | Web + API + Webhooks + Slack/WhatsApp (v3) |
| Fuentes de conocimiento | 4 tipos | 8+ tipos |
| Integraciones CRM | Webhook genérico | HubSpot nativo + Zapier |
| Whitelabeling | No | Widget (v2), Dashboard (v3) |
| Multi-idioma | ES/EN (marketing) | Auto-detect por conversación |
| Developer experience | Bearer token | API keys con scopes + SDK |
| Analytics | Básico | CSAT + RAG quality + exports |

---

## V1 — Fundacional (Estado Actual ✅)

### Plataforma Base

| Feature | Estado | Notas |
|---------|--------|-------|
| Widget embebido en sitios web | ✅ | Script embed + sesiones |
| RAG híbrido (full-text + pgvector) | ✅ | BM25 + embeddings 1536-dim |
| Citations con confidence score | ✅ | Por mensaje |
| Detección de intención comercial → CTA | ✅ | Palabras clave configurables |
| Captación de leads → webhook | ✅ | Payload firmado |
| Ingesta: Sitemap, HTML, PDF, Markdown | ✅ | Versionado, checksum diff |
| Bot builder completo | ✅ | Identidad, prompt, CTA, widget theme |
| Multi-tenant con RBAC | ✅ | admin/editor/viewer por workspace |
| Auth JWT (cookies httpOnly) | ✅ | Password reset, 8h TTL |
| Panel superadmin | ✅ | Tenants, usuarios, solicitudes, plataforma |
| Analytics básico (8 event types) | ✅ | Preguntas sin respuesta agrupadas |
| Blog CMS con SEO | ✅ | ES/EN, auto-ingesta como fuente |
| Eval de cobertura RAG (admin) | ✅ | Endpoint `/v1/admin/evals` |
| Portal cockpit dark mode | ✅ | Design system ck-* teal premium |

---

## V1.5 — Completitud Competitiva ✅ (Completado 2026-03-13)

Todas las features de V1.5 están implementadas en producción: DB migrada, 23 endpoints activos, 6 nuevos componentes Angular desplegados.

### 1. Gestión de API Keys por Tenant ✅
**Por qué:** Los desarrolladores necesitan keys propias, no el bearer global del admin.

```
Nuevos endpoints:
  GET/POST /v1/portal/tenants/:id/api-keys
  DELETE   /v1/portal/tenants/:id/api-keys/:keyId

Nueva tabla: api_keys
  id, tenant_id, name, key_hash, scopes[], last_used_at, expires_at, created_at

Scopes disponibles:
  chat:read      → Acceso a API de conversación
  ingestion:write → Disparar ingestas vía API
  analytics:read  → Leer métricas
  leads:read      → Leer leads capturados
```

**Portal:** Nueva pantalla `/app/settings/api-keys`

---

### 2. Webhook Management Generalizado ✅
**Por qué:** Actualmente solo existe entrega de leads. Se necesita un sistema genérico de eventos.

```
Nuevos endpoints:
  GET/POST/PUT/DELETE /v1/portal/tenants/:id/webhooks
  POST /v1/portal/tenants/:id/webhooks/:webhookId/test

Nueva tabla: webhooks
  id, tenant_id, url, events[], secret_hash, active, retry_count, created_at

Eventos disponibles:
  lead.created           → Lead capturado en conversación
  conversation.started   → Nueva sesión de chat iniciada
  message.unanswered     → Respuesta con fallback/confianza <0.3
  ingestion.completed    → Job de ingesta finalizado (ok)
  ingestion.failed       → Job de ingesta con error
  handover.requested     → Usuario pidió agente humano (v1.5+)

Retry policy: 3 intentos, backoff exponencial (1s, 5s, 30s)
```

**Portal:** Nueva pantalla `/app/settings/webhooks`

---

### 3. Ingesta Programada ✅
**Por qué:** Las fuentes de contenido cambian. La re-ingesta manual es un punto de fricción crítico.

```
Nuevos endpoints:
  GET/POST/PUT/DELETE /v1/portal/tenants/:id/ingestion-schedules

Nueva tabla: ingestion_schedules
  id, tenant_id, source_ids[], cron_expr, active, last_run_at, next_run_at, created_at

Frecuencias soportadas:
  hourly    → "0 * * * *"
  daily     → "0 8 * * *"
  weekly    → "0 8 * * 1"
  custom    → Expresión cron libre

Implementación: node-cron en el ingest-worker, poll de schedules cada minuto
```

**Portal:** Nueva pantalla `/app/knowledge/schedules`

---

### 4. Bot Playground / Testing ✅
**Por qué:** Los usuarios necesitan probar el bot en el portal sin necesidad de embeber el widget en su sitio.

```
Nuevo endpoint:
  POST /v1/portal/tenants/:id/projects/:projectKey/test-chat
  Body: { message: string, conversationHistory?: Message[] }
  Response: Igual que /v1/widget/messages pero sin persistir en DB
```

**Portal:** Nueva pantalla `/app/bots/:botKey/test` con UI de chat inline

---

### 5. Gestión de Miembros del Workspace ✅
**Por qué:** La tabla `tenant_memberships` existe pero sin UI ni endpoints de portal.

```
Nuevos endpoints:
  GET    /v1/portal/tenants/:id/members          → Lista con roles
  PUT    /v1/portal/tenants/:id/members/:userId  → Cambiar rol
  DELETE /v1/portal/tenants/:id/members/:userId  → Remover del workspace
  POST   /v1/portal/tenants/:id/invitations      → Invitar por email (crea user pending + envía email)
```

**Portal:** Nueva pantalla `/app/settings/members`

---

### 6. CSAT — Satisfacción del Usuario ✅
**Por qué:** Métrica básica para medir calidad del bot. La ausencia es un gap vs. todos los competidores.

```
Nuevos endpoints:
  POST /v1/widget/conversations/:id/rating
  Body: { score: 1|2|3|4|5, comment?: string }

  GET  /v1/portal/tenants/:id/analytics/satisfaction
  Response: { avg: number, distribution: Record<1..5, count>, recentComments: [] }

Nueva tabla: conversation_ratings
  id, conversation_id, project_id, score INT, comment TEXT, created_at
```

**Widget:** Añadir prompt de rating al final de conversación (configurable: on/off por proyecto)
**Portal:** Sección en `/app/analytics`

---

### 7. Exportación de Datos ✅
**Por qué:** Los usuarios quieren sacar sus datos. Sin exports no hay confianza en la plataforma.

```
Nuevos endpoints:
  GET /v1/portal/tenants/:id/export/conversations?from=&to=&format=csv|json
  GET /v1/portal/tenants/:id/export/leads?from=&to=&format=csv|json
  GET /v1/portal/tenants/:id/export/analytics?from=&to=&format=csv|json

Response: Content-Disposition: attachment; filename="talkaris-export-*.csv"
```

**Portal:** Botones de export en `/app/conversations`, `/app/leads`, `/app/analytics`

---

### 8. Notificaciones por Email ✅
**Por qué:** Sin alertas, los usuarios no se enteran de leads, errores de ingesta ni conversaciones problemáticas.

```
Nuevos endpoints:
  GET /v1/portal/tenants/:id/notification-prefs
  PUT /v1/portal/tenants/:id/notification-prefs

Nueva tabla: notification_prefs
  tenant_id PK, email_recipients TEXT[],
  lead_created BOOL DEFAULT true,
  ingestion_failed BOOL DEFAULT true,
  low_confidence_alert BOOL DEFAULT false,
  low_confidence_threshold NUMERIC DEFAULT 0.3,
  digest_frequency TEXT DEFAULT 'none'  -- none | daily | weekly

Disparadores (vía webhooks internos o listeners de DB):
  - Lead creado → email a recipients configurados
  - Ingestion.failed → email con error
  - Confidence < threshold → email con mensaje y pregunta
```

**Portal:** Nueva pantalla `/app/settings/notifications`

---

## V2 — Diferenciación y Crecimiento (Activo — desde 2026-03-13)

### 9. Nuevas Fuentes de Ingesta

| Fuente | Implementación | Dependencias |
|--------|---------------|-------------|
| `youtube` | YouTube Data API v3 → transcript | `YOUTUBE_API_KEY` env |
| `api_endpoint` | Fetch URL con headers custom por fuente | Nativo (ya hay http client) |
| `notion` | Notion API v2, integration token por fuente | `notion-client` npm |
| `zendesk` | Zendesk Help Center API v2 | Credentials por fuente |
| `google_drive` | Service account OAuth2 | `googleapis` npm + `GOOGLE_SA_KEY` env |

**Implementación:** Ampliar enum `kind` en tabla `sources` y añadir handlers en `ingest-worker/src/index.ts`
**Portal:** Ampliar modal de "Add Source" en `/app/knowledge` con selector de tipo extendido

---

### 10. Configuración LLM por Proyecto ✅

| Campo | Tipo | Default | Opciones |
|-------|------|---------|---------|
| `provider` | TEXT | openai | openai, anthropic, deepseek, local |
| `model` | TEXT | gpt-4o-mini | gpt-4o, claude-3-5-haiku, deepseek-chat... |
| `temperature` | NUMERIC | 0.3 | 0.0 – 1.0 |
| `max_tokens` | INT | 1024 | 256 – 4096 |
| `system_prompt_additions` | TEXT | null | Instrucciones adicionales al sistema |

**Migration 007:** `ai_config JSONB` en tabla `projects` ✅
**Endpoints:** `GET/PUT /v1/portal/tenants/:id/projects/:key/ai-config` ✅
**Portal:** Sección "AI Model" en Bot Builder (`/app/bots/:botKey`) ✅

---

### 11. Human Handover ✅

**Migration 006:** `handover_events` — status: pending/assigned/closed ✅
**Migration 008:** columnas `claimed_by`, `claimed_at`, `resolved_at`, `notes` ✅
**Endpoints widget:** `POST /v1/widget/conversations/:id/handover` — emite webhook `handover.requested` ✅
**Endpoints portal:** `GET/PUT .../conversations/:id/handover` + cola `GET/PUT .../handovers/:id/claim|resolve` ✅
**Portal:** `conversation-detail` con botones Assign/Close + página `/app/conversations/live` (cola completa) ✅

**Pendiente V2:**
```
Widget: Botón configurable "Hablar con persona" por proyecto (on/off toggle en bot settings)
```

---

### 12. Métricas de Calidad RAG ✅

```
Endpoint implementado:
  GET /v1/portal/tenants/:id/analytics/rag-quality?projectKey=&period=7d|30d|90d

Response:
  {
    fallback_rate: number,        -- % mensajes que usaron fallback
    avg_confidence: number,       -- confianza promedio de respuestas
    low_confidence_count: number, -- mensajes con confidence < 0.3
    unanswered_clusters: [        -- grupos de preguntas sin respuesta
      { topic: string, count: number, examples: string[] }
    ],
    coverage_score: number,       -- 0-100, % de preguntas respondidas
    top_gaps: string[]            -- preguntas más frecuentes sin respuesta
  }
```

**Portal:** Pestaña "Knowledge Quality" en `/app/analytics` — coverage score, fallback rate, avg confidence, knowledge gaps ✅

---

### 13. HubSpot Native Integration

```
Flujo OAuth HubSpot:
  1. Tenant conecta HubSpot → OAuth2 app redirect
  2. Guardamos access_token + refresh_token en tabla integrations
  3. Lead creado → crea Contact en HubSpot + asocia Deal
  4. Conversación → crea Activity en Contact

Nueva tabla: integrations
  id, tenant_id, provider TEXT (hubspot|salesforce|zapier),
  access_token_encrypted TEXT, refresh_token_encrypted TEXT,
  config JSONB (pipeline_id, owner_email, etc.),
  active BOOL, created_at, updated_at

Endpoints:
  GET  /v1/portal/tenants/:id/integrations
  POST /v1/portal/tenants/:id/integrations/hubspot/connect  → redirect OAuth
  GET  /v1/portal/tenants/:id/integrations/hubspot/callback → OAuth callback
  DELETE /v1/portal/tenants/:id/integrations/:integrationId
```

---

### 14. Multi-Idioma Automático en Respuestas

```
Implementación:
  1. Widget detecta Accept-Language header del navegador
  2. Pasa detected_language en body de /v1/widget/messages
  3. API incluye detected_language en prompt: "Responde en: {lang}"
  4. Si project.language='auto', usar el del usuario; si es fijo, usar el configurado

Campo añadir en messages: detected_language TEXT
Campo añadir en projects: language_mode TEXT (fixed|auto) DEFAULT 'fixed'
```

---

### 15. Whitelabeling del Widget

```
Nueva tabla: brand_overrides
  tenant_id PK,
  widget_logo_url TEXT,
  widget_primary_color TEXT,
  widget_remove_branding BOOL DEFAULT false,
  widget_custom_domain TEXT,
  created_at, updated_at

Endpoint:
  GET/PUT /v1/portal/tenants/:id/brand

Widget: Lee brand_overrides desde /v1/widget/config/:siteKey
Portal: Nueva sección "Brand" en /app/settings
```

---

## V3 — Enterprise y Escala (Semanas 20+)

Estas features requieren inversión significativa y se planifican post-validación de mercado.

| Feature | Descripción | Prerequisito |
|---------|-------------|-------------|
| Salesforce Integration | Similar a HubSpot pero con Connected App OAuth | v2 integrations base |
| Zapier/Make Connector | Published connector en Zapier marketplace | Webhooks v1.5 |
| Slack App | Bot en workspace de Slack del cliente | OAuth Slack API |
| WhatsApp Business | Meta partner account, webhook bidireccional | Infra + partner |
| Microsoft Teams | App approval proceso | OAuth M365 |
| Usage metering/billing | Contadores de messages, leads, ingestions | Base de billing |
| SSO/SAML | Enterprise identity federation | Passport.js + SAML lib |
| Audit logs | Registro inmutable de acciones admin | Tabla audit_events |
| SOC 2 preparación | Controles técnicos, pen testing, policies | Audit logs |
| Subdomain routing | tenant.talkaris.com | Nginx proxy + DNS |
| Full dashboard whitelabeling | UI totalmente branded por tenant | Subdomain routing |

---

## Backlog Futuro (Out of Scope)

Los siguientes features exceden el alcance técnico y de negocio actual. Se documentan para planificación futura:

| Feature | Por Qué Esperar | Complejidad |
|---------|-----------------|-------------|
| Voice/Phone support | STT+TTS pipeline + Twilio integration, requiere infra especializada | ★★★★★ |
| Visual flow builder | Editor React Flow, lógica condicional, variables, ramas | ★★★★★ |
| Multi-agent orchestration | Agentes especializados por intención + coordinación | ★★★★★ |
| Knowledge Graph (Neo4j) | Grafo de relaciones sobre el corpus, requiere segundo DB | ★★★★☆ |
| Custom LLM fine-tuning | GPU infra, datasets propios, training pipeline | ★★★★★ |
| Mobile SDK iOS/Android | SDKs nativos separados con lifecycle propio | ★★★★☆ |
| Marketplace de plugins | Catálogo, sandboxing, review process, revenue share | ★★★★★ |
| Video/image understanding | Vision models en pipeline de ingesta | ★★★★☆ |
| A/B testing de widget | Traffic split, métricas de conversión por variante | ★★★☆☆ |
| Shopify/WooCommerce nativo | Catálogo de productos como fuente + order queries | ★★★☆☆ |
| HIPAA compliance | BAA agreements, PHI handling, infra isolation | ★★★★★ |
| Open-source community edition | Codebase público, CI/CD comunitaria | Decisión estratégica |

---

## Métricas de Éxito por Versión

### V1.5 (6–8 semanas)
- 0 churns por "falta de export de datos"
- 100% tenants con al menos 1 webhook configurado
- CSAT promedio ≥ 4.0/5.0 en conversaciones con rating
- Re-ingesta automática funcionando en ≥ 80% de fuentes activas

### V2 (20 semanas)
- ≥ 30% tenants con HubSpot o CRM conectado
- Fallback rate < 15% (mejora con más fuentes + RAG quality feedback loop)
- Time-to-first-bot < 10 minutos (onboarding optimizado)
- NPS ≥ 40

### V3 (Post-PMF)
- Clientes enterprise (>100 empleados) representan ≥ 20% de ARR
- 0 downtimes > 1 hora por mes
- Compliance certificado (SOC 2 Type I al menos)
