# Talkaris — Product Architecture

## Overview

Talkaris is a multi-tenant SaaS platform for deploying AI-powered conversational assistants (chatbots) on websites and applications. It handles the full lifecycle: knowledge ingestion, bot configuration, widget deployment, conversation tracking, and analytics.

---

## System Topology

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TALKARIS PLATFORM                           │
│                                                                     │
│  ┌──────────────┐   ┌──────────────┐   ┌───────────────────────┐   │
│  │   Portal     │   │  Chat API    │   │   Widget (CDN)        │   │
│  │  (Angular)   │◄──│  (Express)   │◄──│   embed.js + frame    │   │
│  │  SSR / CSR   │   │  REST API    │   │                       │   │
│  └──────────────┘   └──────┬───────┘   └───────────────────────┘   │
│                            │                                        │
│                    ┌───────▼───────┐                                │
│                    │  PostgreSQL   │                                │
│                    │  + pgvector   │                                │
│                    └───────┬───────┘                                │
│                            │                                        │
│             ┌──────────────▼──────────────┐                        │
│             │       Ingest Worker         │                        │
│             │  Crawl → Chunk → Embed      │                        │
│             │  + Scheduled re-ingestion   │  ← v1.5               │
│             └─────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────────────┘

Servicios externos:
  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
  │ LLM API     │  │ SMTP Server │  │ YouTube API │  │ Notion API  │
  │ (OpenAI /   │  │ (Nodemailer)│  │ (transcripts│  │ (v2)        │
  │  Anthropic) │  │             │  │  v2)        │  │             │
  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
  │ HubSpot     │  │ Zendesk     │  │ Google      │  │ Zapier/Make │
  │ CRM (v2)    │  │ Help Center │  │ Drive (v2)  │  │ (v3)        │
  │             │  │ (v2)        │  │             │  │             │
  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

---

## Services

### `chat-api` — Express.js API Server
The core backend. Handles all business logic, authentication, data access, and AI response generation.

- **Runtime:** Node.js + TypeScript
- **Framework:** Express 4.x
- **Database:** PostgreSQL via `pg`
- **Auth:** JWT + cookie sessions
- **Key features:** RAG pipeline, widget session management, analytics tracking

### `portal` — Angular 20 SSR App
The user-facing web application. Contains both the public marketing site and the authenticated admin cockpit.

- **Runtime:** Angular 20 with SSR
- **Routing:** Lazy-loaded standalone components
- **State:** Angular Signals + CockpitStore service
- **Two major sections:** Marketing (public) + Cockpit (authenticated)

### `widget` — Embeddable Chat Widget
A lightweight, iframe-isolated chat interface embeddable on any website via a `<script>` tag.

- **Loader:** `embed.js` (~2KB gzip) — creates iframe, passes config
- **Frame:** `frame.html` — the actual chat UI served from CDN
- **API:** Communicates with `chat-api` via REST

### `ingest-worker` — Knowledge Ingestion Service
Background worker that crawls, extracts, and indexes content from configured sources.

- **Inputs:** Sitemap URLs, HTML pages, PDFs, Markdown files
- **Processing:** Text extraction → Semantic chunking → Database storage
- **Scheduling:** Triggered via database job queue

### `ops-cli` — Operations CLI
Command-line tool for platform administrators to manage tenants, projects, sources, and run evaluations.

---

## Domain Model

### Core Entities

```
Workspace (Tenant)
  └── Projects (Bots)
        ├── Sources (Knowledge inputs)
        │     └── Documents (Indexed pages)
        │           └── Chunks (Semantic fragments)
        ├── Conversations
        │     └── Messages
        ├── Leads
        └── Analytics Events
```

### Relationships

| Entity | Belongs To | Has Many |
|--------|-----------|----------|
| Tenant | Platform | Projects, Sources, Memberships |
| Project | Tenant | Sources, Conversations, Leads, Analytics |
| Source | Project | Documents, Ingestion Jobs |
| Document | Source, Project | Chunks (via document_versions) |
| Conversation | Project | Messages |
| User | Platform | TenantMemberships |

---

## Database Schema

### Tablas actuales (v1 + v1.5) — 26 tablas en producción

| Table | Versión | Purpose |
|-------|---------|---------|
| `tenants` | v1 | Organizations / workspaces |
| `users` | v1 | Platform user accounts |
| `tenant_memberships` | v1 | User-tenant role assignments |
| `access_requests` | v1 | Inbound demo/access requests |
| `platform_settings` | v1 | Global branding & configuration |
| `projects` | v1 | Bot configurations |
| `sources` | v1 | Knowledge source definitions |
| `ingestion_jobs` | v1 | Crawl job queue |
| `documents` | v1 | Indexed web pages / files |
| `document_versions` | v1 | Change history per document |
| `chunks` | v1 | Semantic text fragments (+ vectors) |
| `conversations` | v1 | Chat sessions |
| `messages` | v1 | Individual chat messages |
| `lead_events` | v1 | Captured leads from conversations |
| `analytics_events` | v1 | Usage tracking events |
| `password_reset_tokens` | v1 | Password reset flow |
| `blog_posts` | v1 | Multilingual CMS posts |
| `prompt_packs` | v1 | (schema defined, future use) |
| `widget_themes` | v1 | (schema defined, future use) |
| `api_keys` | v1.5 ✅ | API keys por tenant con scopes |
| `webhooks` | v1.5 ✅ | Webhooks generalizados por tenant |
| `ingestion_schedules` | v1.5 ✅ | Schedules de re-ingesta automática |
| `conversation_ratings` | v1.5 ✅ | CSAT scores de conversaciones |
| `notification_prefs` | v1.5 ✅ | Preferencias de notificación email por tenant |
| `invitations` | v1.5 ✅ | Invitaciones de email pendientes de aceptar |
| `handover_events` | v1.5 ✅ | Solicitudes de escalación a agente humano (status: pending/assigned/closed) |

### Tablas v2 (parcial)

| Table | Estado | Purpose |
|-------|--------|---------|
| `projects.ai_config` | v2 ✅ | JSONB column — LLM config per project (migration 007) |
| `handover_events` (ampliada) | v2 ✅ | +claimed_by, +claimed_at, +resolved_at, +notes (migration 008) |
| `integrations` | pendiente | Conexiones OAuth (HubSpot, Salesforce, etc.) |
| `brand_overrides` | pendiente | Whitelabeling por tenant |

---

## Authentication & Authorization

```
Platform Roles:
  superadmin → Full platform access + admin panel
  member     → Tenant-scoped access

Tenant Roles:
  admin  → Full workspace access
  editor → Projects + Knowledge + Analytics
  viewer → Read-only access

User Status:
  pending  → Created, not yet activated
  active   → Normal access
  disabled → Blocked
```

---

## API Surface

### v1 + v1.5 — ~77 endpoints en producción
Ver documentación completa: `talkaris-api-spec.md`

**Grupos v1:**
- Widget API (5 endpoints públicos, sin auth)
- Auth (5 endpoints)
- Tenant Portal (22 endpoints, JWT)
- Admin/Superadmin (15 endpoints, Bearer/JWT)
- Integrations + Ops/Blog (4 endpoints)
- Health (1 endpoint)

**Grupos v1.5 ✅ (añadidos en 2026-03-13):**
- API Keys management (3)
- Webhook management (5) — con test endpoint + HMAC signing
- Ingestion schedules (4)
- Members + invitations (4)
- CSAT rating widget (1) + analytics (1)
- Exports conversations/leads/analytics (3)
- Notification preferences (2)
- Bot playground/test-chat (1)
- Handover — widget POST + portal GET/PUT (3)

### v2 — Parcialmente implementado

**✅ Implementado (2026-03-13):**
- AI config por proyecto: `GET/PUT .../ai-config` (2)
- Human handover cola: `GET .../handovers`, `PUT .../claim`, `PUT .../resolve` (3)
- RAG quality analytics: `GET .../analytics/rag-quality` (1)

**Pendiente:**
- CRM integrations OAuth + CRUD (4)
- Brand/whitelabeling (2)
- Widget handover button toggle (1)

---

## AI Pipeline (RAG)

```
User Query
    │
    ▼
buildLooseTsQuery()     ← Keyword extraction from natural language
    │
    ▼
retrieveChunks()        ← PostgreSQL full-text search (tsvector)
    │                      + commercial intent scoring
    ▼
selectTopChunks()       ← Rank + filter by relevance score
    │
    ▼
buildGroundedPrompt()   ← Compose system + context + query
    │
    ▼
[LLM call]              ← External AI model (configurable)
    │
    ▼
composeAnswer()         ← Parse response, extract citations, add CTA
    │
    ▼
ChatAnswer              ← { message, citations, cta, confidence }
```

---

## Infrastructure

| Component | Technology | Notas |
|-----------|-----------|-------|
| Reverse proxy | Nginx | SSL termination, routing por subdomain |
| Database | PostgreSQL 16 + pgvector | HNSW index para embeddings |
| Process manager | systemd | 4 servicios: api, portal, widget, worker |
| CDN / DNS | Cloudflare | Proxy + DDoS + cache estático |
| Container build | Docker + docker-compose | Build only; runtime via systemd |
| Deployments | `publish-frontend-release.sh` | Symlink-based, zero-downtime |
| Email | SMTP via Nodemailer | MailHog en dev; SMTP real en prod |
| Image generation | SiliconFlow (FLUX.2-pro) | Blog cover images |
| Embeddings | LLM API (1536-dim vectors) | Compatible con OpenAI text-embedding-3-small |

### Puertos por Servicio

| Servicio | Puerto | Systemd Unit |
|---------|--------|-------------|
| Chat API | 4101 | `tecnoria-chat-api.service` |
| Widget | 4102 | `tecnoria-chat-widget.service` |
| Portal (SSR) | 4103 | `tecnoria-chat-portal.service` |

### Paths de Deployment

```
/var/www/talkaris/
  apps/
    chat-api/          ← API source + runtime
    portal/
      releases/
        current → 20260312_184850/   ← symlink activo
        20260312_184850/             ← release actual
        20260311_201434/             ← release anterior
      dist/portal/                   ← staging area del build
    widget/
    ingest-worker/
    ops-cli/
  packages/
    core/              ← chunking, ranking, prompts, types
  docs/                ← documentación técnica
/etc/tecnoria/
  chat-api.env         ← variables de producción de la API
  portal.env           ← variables de producción del portal
/var/www/bin/
  deploy-talkaris-portal.sh     ← build + release del portal
  publish-frontend-release.sh   ← lógica de release genérica
  run-release-entry.sh          ← entrypoint para systemd
```

### Flujo de Deploy del Portal

```
1. git pull (en /var/www/talkaris)
2. /var/www/bin/deploy-talkaris-portal.sh
   → npm run build -w @tecnoria-chat/portal
   → Valida dist/portal/server/server.mjs
   → Copia a releases/<timestamp>/
   → ln -sfn releases/<timestamp> releases/current (atómico)
   → systemctl restart tecnoria-chat-portal.service
   → Verifica HTTP 200 en http://127.0.0.1:4103/
   → Limpia releases >3 versiones antiguas

Rollback manual:
   ln -sfn releases/<anterior> releases/current
   systemctl restart tecnoria-chat-portal.service
```

---

## Feature Flags

Platform settings include a `featureFlags` JSONB field for runtime feature toggling without redeployment. Examples:

```json
{
  "enableBlog": true,
  "enableLeadCapture": true,
  "enableVectorSearch": false,
  "enableFlowBuilder": false
}
```
