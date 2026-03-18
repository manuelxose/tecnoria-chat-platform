# Talkaris — Architecture Decision Records (ADRs)

Este documento registra las decisiones técnicas clave de la plataforma Talkaris, el contexto en que se tomaron, las alternativas consideradas y las consecuencias. Los ADRs son inmutables — cuando una decisión cambia, se añade un nuevo ADR que supersede al anterior.

---

## ADR-001: Stack de Backend — Express.js sobre Node.js

**Estado:** Aceptado

**Contexto:**
El backend necesita servir ~50 endpoints REST, gestionar RAG, ingestas asíncronas y webhooks. La elección del framework determina el modelo de concurrencia, el ecosistema de librerías y el conocimiento del equipo.

**Decisión:**
Express.js 4.x con TypeScript estricto en un monolito modular (todo en `apps/chat-api/src/index.ts`).

**Alternativas consideradas:**

| Alternativa | Razón de descarte |
|-------------|------------------|
| Fastify | Menor ecosistema; Express más familiar; la diferencia de rendimiento es irrelevante a esta escala |
| NestJS | Demasiado opinionado, overhead de decoradores; se prefiere control total |
| Hono | Nuevo, ecosistema pequeño; no justified at this stage |
| Go/Rust | Cambio de lenguaje innecesario; la plataforma es IO-bound, no CPU-bound |

**Consecuencias:**
- ✅ Ecosistema maduro, fácil hiring
- ✅ Compatibilidad total con librerías Node.js (pg, nodemailer, bcryptjs)
- ⚠️ El monolito (`index.ts` ~2600 líneas) necesitará refactoring en módulos cuando supere 5000 líneas

**Plan de refactoring (v2):**
Separar en routers por dominio: `auth.router.ts`, `portal.router.ts`, `widget.router.ts`, `admin.router.ts`.

---

## ADR-002: Base de Datos — PostgreSQL con pgvector

**Estado:** Aceptado

**Contexto:**
La plataforma necesita almacenar conversaciones, documentos, chunks semánticos y vectores de embeddings. Se necesita tanto búsqueda relacional como búsqueda vectorial.

**Decisión:**
PostgreSQL 15+ con la extensión `pgvector` para embeddings. Búsqueda híbrida: `tsvector` (BM25) + `vector` cosine distance, re-rankeado con scoring propio en `@tecnoria-chat/core`.

**Alternativas consideradas:**

| Alternativa | Razón de descarte |
|-------------|------------------|
| Supabase | Vendor lock-in; la plataforma self-hosted necesita control |
| Pinecone + PostgreSQL | Dos bases de datos = complejidad operacional extra, latencia extra por round-trip |
| Weaviate / Qdrant | Más apropiados si vectores fueran el único caso de uso; aquí los datos relacionales son primarios |
| MongoDB | Sin ACID transaccional fuerte; sin soporte nativo para full-text search tan maduro |
| MySQL | Sin pgvector support; extensiones más pobres |

**Consecuencias:**
- ✅ Una sola base de datos para todo (relacional + vectorial)
- ✅ ACID, particionado, índices GIN para full-text, HNSW para vectores
- ✅ Sin dependencias de servicios externos para el core
- ⚠️ pgvector HNSW tiene límites de escala (~10M vectores práctico sin sharding)
- ⚠️ Si se supera 50M chunks, evaluar migración a Qdrant como complemento

**Índices críticos:**
```sql
CREATE INDEX ON chunks USING hnsw (embedding vector_cosine_ops) WITH (m=16, ef_construction=64);
CREATE INDEX ON chunks USING gin (search_vector);
```

---

## ADR-003: Estrategia de Multi-tenancy — Row-Level Isolation

**Estado:** Aceptado

**Contexto:**
La plataforma es SaaS multi-tenant. Los datos de cada tenant deben estar aislados. Hay dos enfoques principales: aislamiento por schema vs. aislamiento por fila.

**Decisión:**
Row-level isolation: todas las tablas tienen `tenant_id` o se relacionan transitivamente con él. No se usan schemas de PostgreSQL separados por tenant. La aplicación enforcea el filtro por `tenant_id` en cada query.

**Alternativas consideradas:**

| Alternativa | Razón de descarte |
|-------------|------------------|
| Schema por tenant | Operacionalmente complejo (migraciones x N schemas), no escala a 1000+ tenants |
| Database por tenant | Aún más costoso operacionalmente; imposible con shared compute |
| RLS (Row-Level Security) nativa de PG | Correcta conceptualmente pero añade complejidad sin beneficio claro dado que la app ya filtra |

**Consecuencias:**
- ✅ Una sola DB, una sola migration path
- ✅ Queries simples con `WHERE tenant_id = $1`
- ⚠️ Un bug de autorización en la app podría filtrar datos entre tenants (mitigado por tests de RBAC)
- ⚠️ Sin aislamiento de performance entre tenants (un tenant con muchos datos afecta latencia global — resolver con particionado en v3)

**Capa de autorización:**
Todo endpoint de portal valida que el `tenant_id` del request pertenece al usuario autenticado antes de ejecutar la query.

---

## ADR-004: Autenticación — JWT en Cookies HttpOnly

**Estado:** Aceptado

**Contexto:**
El portal necesita autenticación stateless con soporte para sesiones de ~8 horas. La API necesita también autenticación para llamadas de máquina (Ops CLI, publisher).

**Decisión:**
- **Usuarios del portal**: JWT firmado con HS256, almacenado en cookie `httpOnly; SameSite=Lax; Secure` (producción). Claims: `{sub, email, platformRole}`. TTL: 8 horas.
- **Ops/Admin**: Bearer token estático (`ADMIN_BEARER_TOKEN`) en header `Authorization`.
- **Publisher**: Bearer token separado (`AUCTORIO_PUBLISHER_TOKEN`).
- **API keys de tenant** (v1.5): `tk_live_[random32]`, hash SHA256 almacenado en DB. Enviado en header `X-Talkaris-Key`.

**Alternativas consideradas:**

| Alternativa | Razón de descarte |
|-------------|------------------|
| localStorage para JWT | Vulnerable a XSS; httpOnly es mejor práctica |
| Sessions con Redis | Introduce dependencia de Redis; sin beneficio para carga actual |
| OAuth2/OIDC completo | Overhead innecesario sin SSO requerido en v1; planificado para v3 enterprise |
| Refresh tokens | Añade complejidad; 8h TTL es aceptable para uso de portal |

**Consecuencias:**
- ✅ Sin estado server-side para sesiones
- ✅ CSRF mitigado por SameSite=Lax
- ⚠️ Sin revocación de tokens (necesario en v2: tabla `revoked_tokens` o cambiar a refresh tokens)
- ⚠️ En v3, migrar a refresh tokens + access tokens de corta vida (15min)

---

## ADR-005: Arquitectura RAG — Búsqueda Híbrida

**Estado:** Aceptado

**Contexto:**
El sistema de recuperación de contexto es el núcleo de la precisión del chatbot. Se necesita balancear velocidad de respuesta (<500ms en p95), precisión (>90% de preguntas respondidas correctamente) y coste operativo.

**Decisión:**
Pipeline híbrido en dos pasos:

```
1. Retrieval (paralelo):
   a. Full-text: ts_rank_cd(search_vector, to_tsquery($userMessage)) → top 20
   b. Semantic: embedding <=> $queryEmbedding ORDER BY distance LIMIT 20

2. Fusion & Re-ranking:
   selectTopChunks(candidates, limit=6) usando:
   - Weighted score: 0.6 * semantic + 0.4 * bm25
   - Deduplicación por document_id
   - Boost por recencia (last_ingested_at)

3. Prompt composition:
   composeAnswer(project, message, topChunks)
   → Incluye guardrails, tono, detección de intención comercial
```

**Alternativas consideradas:**

| Alternativa | Razón de descarte |
|-------------|------------------|
| Solo semantic search | Pierde precision en nombres propios, queries cortas, números de producto |
| Solo full-text (BM25) | Pierde recall en sinónimos, paráfrasis, cross-lingual |
| ColBERT/late interaction | Alta precisión pero ~10x más lento y complejo de implementar |
| Cohere Rerank | Excelente precisión pero añade latencia extra + coste variable por query |

**Modelo de embeddings:**
- Dimensiones: 1536 (compatible con OpenAI text-embedding-3-small y text-embedding-ada-002)
- Índice HNSW: m=16, ef_construction=64

**Consecuencias:**
- ✅ Latencia <200ms para retrieval en corpus <100K chunks
- ✅ Resiliente a variaciones léxicas (semántico) y nombres exactos (full-text)
- ⚠️ A >500K chunks, evaluar particionado de índice HNSW por project_id
- ⚠️ El embedding del query tiene coste por API call → cachear embeddings frecuentes en v2

---

## ADR-006: Pipeline de Ingesta — Worker Proceso Separado

**Estado:** Aceptado

**Contexto:**
La ingesta de documentos es CPU-intensiva (fetching, parsing, chunking, embedding) y puede durar minutos. No puede bloquear el API HTTP.

**Decisión:**
Proceso separado `apps/ingest-worker` que:
1. Recibe jobs de la tabla `ingestion_jobs` (status: queued)
2. Procesa con `SELECT ... FOR UPDATE SKIP LOCKED` (sin Redis)
3. Actualiza estado (running → done/failed) en DB
4. El API solo inserta el job; el worker lo ejecuta asíncronamente

**Alternativas consideradas:**

| Alternativa | Razón de descarte |
|-------------|------------------|
| BullMQ + Redis | Añade dependencia de Redis; `FOR UPDATE SKIP LOCKED` es suficiente para el volumen actual |
| Pub/Sub (NATS/RabbitMQ) | Mismo problema: dependencia externa innecesaria |
| Lambda/Cloud Functions | Vendor lock-in; complejidad de cold starts |
| Worker threads en el API | Acopla API y worker, complica deploys |

**Consecuencias:**
- ✅ Sin dependencias externas de queue
- ✅ Restart del worker no pierde jobs (siguen en DB como `queued`)
- ⚠️ Sin priorización de jobs (FIFO estricto) — aceptable en v1
- ⚠️ Solo una instancia del worker puede correr sin coordinación (FOR UPDATE SKIP LOCKED resuelve competencia, pero throughput es lineal)
- **Plan de escalado (v2):** Múltiples instancias del worker son seguras gracias a `SKIP LOCKED`. Para jobs de alta prioridad añadir columna `priority INT DEFAULT 5`.

**Schedules en v1.5:**
El worker añadirá un loop `node-cron` que poll `ingestion_schedules` cada minuto y dispara jobs vencidos.

---

## ADR-007: Integración LLM — Provider Abstraction

**Estado:** Propuesto (Pendiente de confirmar implementación actual)

**Contexto:**
La plataforma necesita llamar a un LLM para generar respuestas. La elección del proveedor afecta coste, latencia, calidad y vendor lock-in. El código actual tiene la lógica de `composeAnswer` en el core pero la llamada real al LLM no es visible en el audit del código.

**Decisión propuesta:**
Abstraer el proveedor LLM detrás de una interfaz `LLMProvider`:

```typescript
interface LLMProvider {
  complete(prompt: string, config: LLMConfig): Promise<LLMResponse>
}

type LLMConfig = {
  provider: 'openai' | 'anthropic' | 'deepseek' | 'local'
  model: string
  temperature: number
  max_tokens: number
}
```

**Provider defaults por entorno:**

| Entorno | Provider | Model | Razón |
|---------|----------|-------|-------|
| Producción | OpenAI | gpt-4o-mini | Mejor ratio coste/calidad en 2025 |
| Alta calidad | OpenAI | gpt-4o | Para proyectos enterprise |
| Low-cost | DeepSeek | deepseek-chat | ~10x más barato para volúmenes altos |
| Privacy-first | Local (Ollama) | llama3 | On-premise para clientes con datos sensibles |
| Alternativa | Anthropic | claude-3-5-haiku | Mejor razonamiento, ligeramente más caro |

**Consecuencia:**
- El campo `ai_config` en `projects` (JSONB) permite override por bot
- El platform_settings define el default global
- Sin `ai_config`, todos los bots usan el mismo modelo (economía de escala)

---

## ADR-008: Portal Frontend — Angular SSR Standalone

**Estado:** Aceptado

**Contexto:**
El portal necesita ser SEO-friendly (para páginas de marketing y blog), tiene un ciclo de vida largo y necesita renderizado del lado del servidor para la percepción de velocidad inicial.

**Decisión:**
Angular 20 con standalone components, lazy loading por ruta, y SSR con `@angular/ssr`. No se usa NgModule. Estado compartido via Angular Signals.

**Alternativas consideradas:**

| Alternativa | Razón de descarte |
|-------------|------------------|
| Next.js / React | El equipo tiene expertise en Angular; cambio no justificado |
| Nuxt.js / Vue | Mismo argumento; Angular mejor para aplicaciones de gran escala |
| SvelteKit | Moderno pero ecosistema más pequeño para SaaS complejos |
| SPA sin SSR | SEO malo para páginas de marketing |
| Astro | Excelente para contenido estático, pero el portal es altamente interactivo |

**Consecuencias:**
- ✅ SSR funcional: robots pueden indexar el marketing site
- ✅ Standalone components simplifican el árbol de módulos
- ✅ Signals son más eficientes que zone.js para el cockpit
- ⚠️ Angular build es lento (30-36s en prod) — aceptable dado que deploy es ~1/día
- ⚠️ Bundle inicial 391KB — aceptable; lazy chunks reducen carga por ruta

---

## ADR-009: Estrategia de Deployment — Release-Based con Systemd

**Estado:** Aceptado

**Contexto:**
La plataforma se auto-hostea en un VPS Linux. Se necesita deploy con cero downtime, rollback rápido y sin orquestadores de contenedores.

**Decisión:**
Sistema de releases basado en symlinks:
```
releases/
  20260312_184850/   ← release actual
  20260311_201434/   ← release anterior (cleanup automático)
current → 20260312_184850  ← symlink
```

El script `publish-frontend-release.sh`:
1. Copia staging dist a `releases/<timestamp>/`
2. Verifica que el build es válido (existe `server.mjs`)
3. Actualiza symlink `current` atómicamente
4. Hace `systemctl restart` del servicio
5. Verifica HTTP response del nuevo release

**Alternativas consideradas:**

| Alternativa | Razón de descarte |
|-------------|------------------|
| Docker Compose | Overhead de containers no justificado para un VPS single-node |
| Kubernetes | Mucho overhead para el tamaño actual |
| PM2 | Menos robusto que systemd para monitoreo de sistema |
| Blue-Green deployment | Requiere doble capacidad de compute |
| Capistrano | Herramienta Ruby, innecesario en stack Node.js |

**Consecuencias:**
- ✅ Rollback instantáneo: `ln -sfn releases/<anterior> releases/current && systemctl restart`
- ✅ Sin overhead de Docker en runtime
- ✅ Logs via `journalctl -u tecnoria-chat-portal.service`
- ⚠️ Single node = SPOF; en v2 añadir load balancer + dos nodos con deploy coordinado

---

## ADR-010: Validación de Inputs — Zod

**Estado:** Aceptado

**Contexto:**
Los endpoints reciben JSON no confiable de usuarios y del widget. Se necesita validación robusta y mensajes de error útiles.

**Decisión:**
Zod 3.x para validación de todos los request bodies y query params. Schemas colocados junto a los handlers. En caso de error, retornar 400 con el mensaje de Zod parseado.

**Alternativas consideradas:**

| Alternativa | Razón de descarte |
|-------------|------------------|
| Joi | Más verbose, TypeScript types menos ergonómicos |
| class-validator | Acoplado a decoradores/NestJS, no idiomático con Express |
| express-validator | Menos expresivo, types peores |
| Manual validation | Error-prone, no escalable |

**Consecuencias:**
- ✅ Runtime validation + compile-time TypeScript types desde el mismo schema
- ✅ Mensajes de error detallados (campo, razón)
- ⚠️ Zod no valida JSONB columns en DB (se confía en el schema de inserción)

---

## ADR-011: Modelo de API Keys para Tenants (v1.5)

**Estado:** Propuesto

**Contexto:**
Los tenants necesitan keys para integrar Talkaris con sus sistemas vía API, sin exponer las sesiones JWT. Las keys deben tener scopes limitados y ser revocables.

**Decisión:**
Formato: `tk_live_[base58(32 bytes)]`
- Prefix `tk_live_` para reconocimiento visual
- 32 bytes random = 256 bits de entropía (imposible de bruteforce)
- Se muestra UNA sola vez al crear; solo se almacena `SHA256(key)`
- Scopes: `chat:read`, `ingestion:write`, `analytics:read`, `leads:read`

**Consecuencias:**
- ✅ Keys revocables individualmente sin afectar otras
- ✅ Sin posibilidad de recuperar la key (el tenant debe rotarla si la pierde)
- ⚠️ Sin keys de tipo "test" con limitaciones (añadir `tk_test_` prefix en v2)
- ⚠️ Rate limiting por API key independiente del rate limiting por IP

---

## ADR-012: Ingesta Programada — node-cron en Worker (v1.5)

**Estado:** Propuesto

**Contexto:**
La re-ingesta automática necesita ejecutarse en horarios configurados por el tenant sin sobrecargar el sistema.

**Decisión:**
`node-cron` en el ingest-worker con poll de `ingestion_schedules` cada minuto:
```
SELECT * FROM ingestion_schedules WHERE active = true AND next_run_at <= NOW()
→ Por cada schedule vencido:
  → INSERT INTO ingestion_jobs para cada source_id
  → UPDATE ingestion_schedules SET last_run_at = NOW(), next_run_at = <next cron tick>
```

**Alternativas consideradas:**

| Alternativa | Razón de descarte |
|-------------|------------------|
| BullMQ + Redis | Introduce Redis; innecesario si el volumen es <1000 schedules |
| pg_cron (PostgreSQL extension) | Requiere permisos superuser en DB |
| Systemd timers | No tiene acceso al estado de la app para crear jobs |
| Agenda.js | Abstracción sobre MongoDB; incompatible |

**Consecuencias:**
- ✅ Sin dependencias externas adicionales
- ✅ Tolerante a reinicios: schedules vencidos se ejecutan al levantar el worker
- ⚠️ Solo una instancia del worker debe correr (evitar jobs duplicados)
- ⚠️ Para HA (múltiples workers), añadir `SELECT ... FOR UPDATE SKIP LOCKED` también en schedule poll

---

## Registro de Cambios

| Versión | Fecha | ADR | Cambio |
|---------|-------|-----|--------|
| 1.0 | 2026-03-12 | ADR-001..010 | Documentación inicial del estado actual |
| 1.1 | 2026-03-12 | ADR-011..012 | ADRs propuestos para v1.5 |
