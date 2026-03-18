# Talkaris — Screen Map

## Complete Screen Inventory

---

## Public Marketing (Unauthenticated)

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | PublicPageComponent | Home (ES) |
| `/funcionalidades` | PublicPageComponent | Features (ES) |
| `/integraciones` | PublicPageComponent | Integrations (ES) |
| `/casos-de-uso` | PublicPageComponent | Use Cases (ES) |
| `/faq` | PublicPageComponent | FAQ (ES) |
| `/blog` | BlogListPageComponent | Blog listing (ES) |
| `/blog/:slug` | BlogArticlePageComponent | Blog post (ES) |
| `/en` | PublicPageComponent | Home (EN) |
| `/en/features` | PublicPageComponent | Features (EN) |
| `/en/integrations` | PublicPageComponent | Integrations (EN) |
| `/en/use-cases` | PublicPageComponent | Use Cases (EN) |
| `/en/faq` | PublicPageComponent | FAQ (EN) |
| `/en/blog` | BlogListPageComponent | Blog listing (EN) |
| `/en/blog/:slug` | BlogArticlePageComponent | Blog post (EN) |
| `/solicitar-demo` | AccessRequestPageComponent | Demo request (ES) |
| `/en/request-demo` | AccessRequestPageComponent | Demo request (EN) |

---

## Authentication

| Route | Component | Purpose |
|-------|-----------|---------|
| `/login` | LoginPageComponent | Sign in |
| `/reset-password` | ResetPasswordPageComponent | Reset password |

---

## Tenant Cockpit (`/app/*`)

Shell: `CockpitShellComponent` — persistent sidebar + layout

### Dashboard
| Route | Component | Key Content |
|-------|-----------|-------------|
| `/app/dashboard` | DashboardComponent | Stats (bots, conversations, sources, jobs), Bot table, Ingestion activity, Quick actions, Platform status |

### Bots
| Route | Component | Key Content |
|-------|-----------|-------------|
| `/app/bots` | BotsListComponent | Searchable/filterable bot table, status badges, snippet button |
| `/app/bots/new` | BotBuilderComponent | Create form: identity, prompt policy, CTA config, widget theme |
| `/app/bots/:botKey` | BotBuilderComponent | Edit form + embed snippet + danger zone |
| `/app/deployments` | BotDeploymentsComponent | Deployment status overview, counts by status |

### Conversations
| Route | Component | Key Content |
|-------|-----------|-------------|
| `/app/conversations` | ConversationsComponent | Filterable conversation history, project filter |
| `/app/conversations/:id` | ConversationDetailComponent | Full message thread, roles, citations, confidence |

### Knowledge
| Route | Component | Key Content |
|-------|-----------|-------------|
| `/app/knowledge` | KnowledgeSourcesComponent | Sources table with type/visibility, add source form, sync button |
| `/app/knowledge/documents` | KnowledgeDocumentsComponent | Indexed documents table, search, type/bot filter |
| `/app/knowledge/ingestions` | KnowledgeIngestionComponent | Job queue with status, queue new job, status summary |

### Analytics & Data
| Route | Component | Key Content |
|-------|-----------|-------------|
| `/app/analytics` | AnalyticsComponent | Event metrics grid, unanswered questions table, lead delivery status |
| `/app/leads` | LeadsComponent | Filterable leads table, payload preview |

### Developers
| Route | Component | Key Content |
|-------|-----------|-------------|
| `/app/developers` | DevelopersComponent | Bot selector → embed snippet, JS API reference, REST API endpoints, webhook docs |

### Settings
| Route | Component | Key Content |
|-------|-----------|-------------|
| `/app/settings` | SettingsComponent | Workspace info, account info, quick navigation |

---

## Superadmin Cockpit (`/admin/*`)

Shell: `AdminShellComponent` — red-accented sidebar, separate from tenant cockpit

| Route | Component | Key Content |
|-------|-----------|-------------|
| `/admin/overview` | AdminOverviewComponent | Platform-wide stats (tenants, users, projects, convos, leads, pending), recent requests, quick links |
| `/admin/requests` | AdminRequestsComponent | Access request queue, pending/all tabs, approve/reject with one click |
| `/admin/tenants` | AdminTenantsComponent | All tenants table, create tenant form |
| `/admin/users` | AdminUsersComponent | All users table, create user form, assign workspace/role |
| `/admin/platform` | AdminPlatformComponent | Full branding/SEO/infrastructure settings |

---

## Screen Structure Pattern

Each screen follows this structure:

```
┌─────────────────────────────────────────────────┐
│  TOPBAR                                         │
│  breadcrumb ·················· actions          │
├─────────────────────────────────────────────────┤
│  CONTENT                                        │
│  ┌─────────────────────────────────────────┐    │
│  │ PAGE HEADER                             │    │
│  │ Title                                   │    │
│  │ Subtitle ·············· page actions   │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  [Stats row if applicable]                      │
│                                                 │
│  ┌─────────────────┐  ┌──────────────────────┐ │
│  │ TOOLBAR         │  │                      │ │
│  │ search | filters│  │   Main content       │ │
│  └─────────────────┘  │   (table / cards)    │ │
│                       │                      │ │
│  ┌────────────────┐   └──────────────────────┘ │
│  │ SECONDARY CARD │                             │
│  │ (form / info)  │                             │
│  └────────────────┘                             │
└─────────────────────────────────────────────────┘
```

---

## Navigation Map

```
Authenticated User
├── /app
│   ├── /app/dashboard ★ Landing page
│   ├── /app/bots
│   │   ├── /app/bots (list)
│   │   ├── /app/bots/new
│   │   ├── /app/bots/:botKey (edit)
│   │   └── /app/deployments
│   ├── /app/conversations
│   │   ├── /app/conversations (list)
│   │   └── /app/conversations/:id (detail)
│   ├── /app/knowledge
│   │   ├── /app/knowledge (sources)
│   │   ├── /app/knowledge/documents
│   │   └── /app/knowledge/ingestions
│   ├── /app/analytics
│   ├── /app/leads
│   ├── /app/developers
│   └── /app/settings
│
└── /admin (superadmin only)
    ├── /admin/overview
    ├── /admin/requests
    ├── /admin/tenants
    ├── /admin/users
    └── /admin/platform
```

---

## Planned Screens — v1.5 (Próximas 6–8 semanas)

### Settings (expandido)

| Route | Component | Key Content | API |
|-------|-----------|-------------|-----|
| `/app/settings/members` | `settings/members.component.ts` | Lista de miembros, roles, invitar por email | GET/PUT/DELETE members, POST invitations |
| `/app/settings/api-keys` | `settings/api-keys.component.ts` | Crear/listar/revocar API keys, ver scopes | GET/POST/DELETE api-keys |
| `/app/settings/webhooks` | `settings/webhooks.component.ts` | Webhooks configurados, eventos, botón test, logs de entrega | GET/POST/PUT/DELETE/test webhooks |
| `/app/settings/notifications` | `settings/notifications.component.ts` | Alertas email: leads, fallos de ingesta, umbral de confianza, digest | GET/PUT notification-prefs |

### Knowledge (expandido)

| Route | Component | Key Content | API |
|-------|-----------|-------------|-----|
| `/app/knowledge/schedules` | `knowledge/knowledge-schedules.component.ts` | Schedules de re-ingesta: frecuencia, fuentes, próxima ejecución, historial | GET/POST/PUT/DELETE ingestion-schedules |

### Bots (expandido)

| Route | Component | Key Content | API |
|-------|-----------|-------------|-----|
| `/app/bots/:botKey/test` | `bots/bot-test.component.ts` | Chat playground inline: enviar mensajes de prueba, ver citations y confidence score sin afectar conversaciones reales | POST test-chat |

---

## Planned Screens — v2 (Semanas 9–20)

### Integraciones

| Route | Component | Key Content | API |
|-------|-----------|-------------|-----|
| `/app/integrations` | `integrations/integrations.component.ts` | Catálogo de integraciones disponibles (HubSpot, Zapier, etc.), estado de conexión | GET integrations |
| `/app/integrations/hubspot` | `integrations/hubspot.component.ts` | Conectar/desconectar HubSpot, configurar pipeline target, previsualizar mapeo de campos | OAuth flow HubSpot |

### Conversaciones (Live)

| Route | Component | Key Content | API |
|-------|-----------|-------------|-----|
| `/app/conversations/live` | `conversations/live.component.ts` | Cola de handovers pendientes, tomar conversación, chat en tiempo real, marcar resuelto | GET/PUT handovers |

### Bot Builder (expandido)

| Route | Component | Key Content | Nuevo |
|-------|-----------|-------------|-------|
| `/app/bots/:botKey` (update) | `bot-builder.component.ts` | Nueva sección "AI Model": selector de proveedor/modelo, temperatura, max tokens, instrucciones adicionales | PUT ai-config |

### Analytics (expandido)

| Route | Component | Nuevo contenido |
|-------|-----------|-----------------|
| `/app/analytics` (update) | `analytics.component.ts` | Nueva card "Satisfacción": CSAT promedio, distribución 1–5 stars, comentarios recientes |
| `/app/analytics` (update) | `analytics.component.ts` | Nueva card "Calidad RAG": fallback rate, avg confidence, gaps de conocimiento detectados |

### Settings (expandido v2)

| Route | Component | Key Content |
|-------|-----------|-------------|
| `/app/settings/brand` | `settings/brand.component.ts` | Logo del widget, color primario, eliminar branding de Talkaris, dominio custom |

---

## Planned Screens — v3 / Futuro

| Route | Purpose | Status |
|-------|---------|--------|
| `/app/channels/whatsapp` | Configurar número WhatsApp Business, conectar Meta | v3 |
| `/app/channels/slack` | Instalar Slack App en workspace | v3 |
| `/app/channels/teams` | Conectar Microsoft Teams | v3 |
| `/app/ai/flows` | Visual flow builder (nodos + condiciones) | Futuro |
| `/app/ai/models` | Gestión avanzada de modelos LLM por tenant | v3 |
| `/app/automation/jobs` | Gestión avanzada de jobs programados | v3 |
| `/app/usage` | Métricas de uso vs. límites del plan | v3 |

---

## URL Conventions

- `/app/*` — Tenant cockpit (requires authentication, any role)
- `/admin/*` — Superadmin cockpit (requires `platformRole === 'superadmin'`)
- `/login`, `/reset-password` — Auth flows
- `/:lang/*` — Public marketing (ES default, EN with `/en` prefix)
- Deep links preserve context via Angular routing
