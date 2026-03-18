# Talkaris — Guía de Integraciones

Este documento cubre todas las integraciones disponibles, planificadas y futuras de la plataforma Talkaris: fuentes de conocimiento, canales de mensajería, CRM, webhooks y herramientas de automatización.

---

## 1. Fuentes de Conocimiento (Knowledge Sources)

### Disponibles Actualmente (v1)

#### Sitemap XML
**Tipo:** `sitemap`
**Caso de uso:** Indexar todo el contenido público de un sitio web.
```
Configuración:
  entryUrl: https://ejemplo.com/sitemap.xml
  includePatterns: ["https://ejemplo.com/docs/*"]
  excludePatterns: ["https://ejemplo.com/docs/internal/*"]
  allowedDomains: ["ejemplo.com"]

Proceso:
  1. Fetch del sitemap XML
  2. Extrae todas las URLs
  3. Crawl de cada URL respetando include/exclude patterns
  4. Extrae texto visible, título, meta descripción
  5. Chunking semántico + embeddings
```

#### HTML (URL directa o crawl recursivo)
**Tipo:** `html`
**Caso de uso:** Indexar páginas específicas o secciones del sitio.
```
Configuración:
  entryUrl: https://ejemplo.com/producto
  allowedDomains: ["ejemplo.com"]
  includePatterns: ["https://ejemplo.com/producto/*"]

Proceso: Igual que sitemap pero partiendo de una URL raíz con follow-links
```

#### PDF
**Tipo:** `pdf`
**Caso de uso:** Documentos técnicos, manuales, contratos, whitepapers.
```
Configuración:
  entryUrl: https://ejemplo.com/manual.pdf
  visibility: public|private
  defaultCategory: "Manual de producto"
```

#### Markdown / Texto Plano
**Tipo:** `markdown`
**Caso de uso:** Documentación técnica en repositorios (docs/, wikis), bases de conocimiento en Markdown.
```
Configuración:
  entryUrl: https://raw.githubusercontent.com/org/repo/main/docs/README.md
  allowedDomains: ["raw.githubusercontent.com"]
```

---

### Planificadas v2

#### YouTube (Transcripts)
**Tipo:** `youtube`
**Caso de uso:** Videos explicativos, webinars, demos de producto, tutoriales.
```
Prerrequisito: YOUTUBE_API_KEY en variables de entorno del ingest-worker

Configuración en portal:
  entryUrl: https://www.youtube.com/channel/UCxxxx  (canal)
           https://www.youtube.com/playlist?list=PLxxx (playlist)
           https://www.youtube.com/watch?v=xxxx  (video individual)
  credentials: {} (no requiere auth para videos públicos)

Proceso:
  1. YouTube Data API v3: list videos del canal/playlist
  2. Para cada video: obtener transcript via YouTube Captions API
     → Si no hay auto-caption, marcar como `no_transcript`
  3. Chunking del transcript con timestamps
  4. Metadata: título del video, descripción, fecha de publicación

Limitaciones:
  - Solo videos con captions activados (auto o manual)
  - Rate limit YouTube API: 10,000 unidades/día (gratis)
  - Transcripts en el idioma original del video
```

#### API Endpoint Custom
**Tipo:** `api_endpoint`
**Caso de uso:** FAQs desde un CMS, catálogo de productos, base de conocimiento propia via API REST.
```
Configuración:
  entryUrl: https://api.ejemplo.com/v1/faq
  credentials:
    headers:
      Authorization: "Bearer xxx"
      X-API-Key: "yyy"

Proceso:
  1. GET entryUrl con headers configurados
  2. Espera respuesta JSON (array de objetos con title + content/body/text)
  3. Si la respuesta tiene paginación:
     → Sigue next_page/cursor mientras exista
  4. Cada item del array se trata como un documento

Formato esperado de response:
  [
    { "title": "¿Cómo puedo cancelar?", "content": "Puedes cancelar desde..." },
    { "title": "¿Qué formas de pago aceptan?", "content": "Aceptamos..." }
  ]
  O variantes: "body", "text", "description" como campo de contenido
```

#### Notion
**Tipo:** `notion`
**Caso de uso:** Wikis de empresa en Notion, bases de conocimiento internas, runbooks.
```
Prerrequisito: Integration token de Notion (workspace admin crea la integration)

Configuración:
  entryUrl: https://www.notion.so/myworkspace/Database-ID  (database)
           https://www.notion.so/Page-ID  (página individual)
  credentials:
    integrationToken: "secret_xxx"

Setup en Notion:
  1. Ir a notion.so/my-integrations → Nueva integración
  2. Copiar el "Internal Integration Token"
  3. Compartir la página/database con la integración (Share → Add connections)
  4. Pegar el token en Talkaris

Proceso:
  1. Notion API v2: retrieve page o query database
  2. Para databases: iterar todas las páginas (con paginación)
  3. Para páginas: fetch blocks recursivamente
  4. Convertir blocks de Notion a Markdown
  5. Chunking + embeddings

Limitaciones:
  - Rate limit Notion API: 3 req/s
  - Solo contenido de páginas/databases compartidas con la integration
  - Archivos adjuntos a páginas Notion no se procesan (solo texto)
```

#### Zendesk Help Center
**Tipo:** `zendesk`
**Caso de uso:** Artículos de help center, FAQs de soporte, guías de uso.
```
Configuración:
  entryUrl: https://empresa.zendesk.com
  credentials:
    email: admin@empresa.com
    apiToken: "xxx"

Proceso:
  1. Zendesk API: GET /api/v2/help_center/articles (paginado)
  2. Filtra por locale (usa el language del proyecto)
  3. Extrae title + body HTML → convierte a texto
  4. Metadata: sección, categoría, fecha de actualización

Rate limit Zendesk: 700 req/min (plan Professional+)
```

#### Google Drive
**Tipo:** `google_drive`
**Caso de uso:** Documentos corporativos en Google Docs/Sheets, presentaciones.
```
Prerrequisito: Service Account de Google Cloud + Drive API activada

Configuración:
  entryUrl: FOLDER_ID o FILE_ID de Google Drive
  credentials:
    serviceAccountKey: { "type": "service_account", "project_id": "...", ... }

Setup:
  1. Google Cloud Console → New Project → Enable Drive API
  2. IAM → Service Accounts → Create → Download JSON key
  3. En Google Drive: compartir la carpeta con el email del service account
  4. Subir el JSON key en Talkaris (se encripta antes de almacenar)

Tipos de archivo soportados:
  - Google Docs → texto + estructura de headers
  - Google Sheets → cada sheet como tabla markdown
  - PDFs → extrae texto (si son PDFs con texto, no escaneados)
  - Archivos .txt, .md → texto directo

Limitaciones:
  - Imágenes escaneadas (PDFs de imagen) no se procesan en v2
  - Google Slides: solo extrae texto de las diapositivas (no diseño)
  - Rate limit Drive API: 1000 req/100s
```

---

### Roadmap de Fuentes (v3 y futuro)

| Fuente | Descripción | Estado |
|--------|-------------|--------|
| Confluence | Wikis de Atlassian (OAuth Cloud + Data Center) | Planificado v3 |
| SharePoint | Documentos Microsoft 365 (OAuth MSAL) | Planificado v3 |
| Gitbook | Documentación técnica en Gitbook | Planificado v3 |
| Jira (tickets) | Base de conocimiento de issues resueltos | Backlog |
| Intercom Articles | Artículos de base de conocimiento de Intercom | Backlog |
| GitHub Wiki | Wikis de repositorios públicos | Backlog |
| RSS Feed | Artículos de blog via RSS | Backlog |
| CSV/XLSX Upload | Subida directa de archivos tabulares | Backlog |
| Google Search Console | Preguntas reales de usuarios del sitio | Backlog |

---

## 2. Canales de Mensajería

### Disponible Actualmente (v1)

#### Web Widget (Embeddable Script)
**Estado:** ✅ Producción
```html
<!-- Snippet de embebido -->
<script>
  window.TalkarisWidget = { siteKey: "YOUR_SITE_KEY" };
  (function(d, s) {
    var j = d.createElement(s);
    j.src = "https://widget.talkaris.com/v1/widget.js";
    j.async = true;
    d.head.appendChild(j);
  })(document, "script");
</script>
```

**Características:**
- Launcher flotante (configurable: posición, etiqueta)
- Ventana de chat con historial de sesión
- Soporte de citas con links clickables
- CTAs configurables (botones de acción)
- Captura de leads inline
- Temas personalizables (colores, tipografía)
- Restricción por dominio (`allowedDomains`)

---

### Planificadas v3

#### Slack App
**Estado:** Planificado v3
```
Flujo:
  1. Tenant instala la Slack App desde portal
  2. OAuth con workspace de Slack del cliente
  3. Bot aparece en Slack como app
  4. Usuarios de Slack pueden hacer preguntas en cualquier canal
     donde el bot esté invitado
  5. Respuestas con el mismo RAG del web widget
  6. Leads capturados se sincronizan

Configuración:
  - Canales permitidos
  - Respuesta pública o ephemeral (solo visible para el que pregunta)
  - Handover a DM con agente humano

Prerrequisitos técnicos:
  - Slack API (Bolt SDK para Node.js)
  - OAuth 2.0 App con scopes: channels:read, chat:write, app_mentions:read
  - Slash commands (opcional: /ask)
  - Event subscriptions via ngrok/webhook
```

#### WhatsApp Business API
**Estado:** Planificado v3
```
Prerrequisitos:
  - Cuenta Meta Business verificada
  - Número de teléfono dedicado
  - Aprobación de Meta (proceso 1-4 semanas)

Flujo:
  1. Tenant conecta número de WhatsApp vía portal
  2. Meta Cloud API webhooks → Talkaris
  3. Usuarios envían mensajes al número
  4. Talkaris responde via RAG
  5. Conversaciones en portal igual que web widget

Limitaciones:
  - Solo templates pre-aprobados para mensajes outbound
  - Ventana de 24h para respuestas de sesión
  - Rate limits variables por tier de negocio
```

#### Microsoft Teams
**Estado:** Planificado v3
```
Similar a Slack:
  - Azure App Registration (OAuth M365)
  - Bot Framework SDK
  - Deploy como Teams App (proceso de aprobación Microsoft)
  - Respuestas en canales y DMs
```

#### Messenger / Instagram Direct
**Estado:** Planificado v3
```
Requiere:
  - Meta Business Account verificada
  - Webhook bidireccional (Graph API)
  - Revisión de app Meta para permisos `messages`
```

#### Telegram Bot
**Estado:** Backlog futuro
#### Voice/Phone (Twilio)
**Estado:** Backlog futuro (STT + TTS pipeline)

---

## 3. CRM e Integraciones de Ventas

### Webhook Genérico (Disponible v1)
**Estado:** ✅ Producción

El sistema actual entrega leads via webhook HTTP POST a cualquier endpoint configurado.

**Payload de lead:**
```json
{
  "event": "lead.created",
  "timestamp": "2026-03-12T18:00:00.000Z",
  "tenantId": "uuid",
  "projectKey": "mi-bot",
  "conversationId": "uuid",
  "lead": {
    "name": "Ana García",
    "email": "ana@empresa.com",
    "company": "Empresa S.L.",
    "phone": "+34 600 000 000",
    "message": "Me interesa el plan Enterprise",
    "service1": "Plan Enterprise",
    "service2": null
  }
}
```

**Verificación del origen:**
El header `x-talkaris-signature` contiene `HMAC-SHA256(payload, secretHeaderValue)`.

---

### Webhooks Generalizados (v1.5)

A partir de v1.5, todos los eventos del sistema están disponibles como webhooks:

| Evento | Cuándo se dispara | Payload |
|--------|-------------------|---------|
| `lead.created` | Lead capturado en conversación | Lead + conversación |
| `conversation.started` | Nueva sesión iniciada | conversationId, siteKey, origin |
| `message.unanswered` | Respuesta con fallback o confidence < 0.3 | Mensaje del usuario, score |
| `ingestion.completed` | Job de ingesta finalizado con éxito | jobId, documentsProcessed, chunksCreated |
| `ingestion.failed` | Job de ingesta con error | jobId, error, sourceId |
| `handover.requested` | Usuario pidió hablar con humano | conversationId, reason |
| `rating.submitted` | Usuario dejó rating | conversationId, score, comment |

**Retry policy:** 3 intentos, backoff exponencial (inmediato, 5s, 30s).
**Timeout:** 10 segundos por intento.
**Firma:** `X-Talkaris-Signature: t=timestamp,v1=HMAC-SHA256(t.payload,secret)`

---

### HubSpot (v2)
**Estado:** Planificado v2

```
Setup:
  1. En portal Talkaris → Integraciones → Conectar HubSpot
  2. OAuth2 redirect → HubSpot autorización
  3. Talkaris recibe access_token + refresh_token
  4. Tokens encriptados en DB (tabla integrations)

Comportamiento:
  → Lead capturado en Talkaris:
      → Crear/actualizar Contact en HubSpot (por email)
      → Crear Deal asociado (pipeline y stage configurables)
      → Añadir Note con transcript de la conversación
      → Añadir Activity "Lead de Chatbot"

  → Conversación con usuario ya en HubSpot:
      → Añadir Activity al Contact existente
      → Actualizar propiedades configuradas (last_chat_date, etc.)

Configuración disponible:
  - Pipeline de ventas target
  - Stage inicial del Deal
  - Propietario de lead (owner)
  - Campos de Contact a rellenar (custom properties)
  - Conversaciones que se envían (todas vs. solo con lead)
```

---

### Salesforce (v3)
**Estado:** Planificado v3

Similar a HubSpot pero con OAuth Connected App.
Crea Lead → Contact → Opportunity en el CRM.

---

### Zapier / Make (v3)
**Estado:** Planificado v3

```
Approach:
  - Talkaris publica un "Trigger" en Zapier marketplace
  - Basado en webhooks v1.5 ya implementados
  - Usuario conecta Zapier → Talkaris → cualquier app (Google Sheets, Slack, Notion, CRM...)

Eventos disponibles como Zapier Triggers:
  - "New Lead" → Trigger cuando lead.created
  - "New Conversation" → Trigger cuando conversation.started
  - "Unanswered Question" → Trigger cuando message.unanswered
  - "Ingestion Failed" → Trigger cuando ingestion.failed

Zapier Actions (opcional v3):
  - "Trigger Ingestion" → Dispara re-ingesta de una fuente
  - "Create Bot" → Crea un nuevo proyecto via API
```

---

## 4. Notificaciones y Alertas

### Email (v1.5)

Requiere configuración SMTP en el servidor.

| Notificación | Disparador | Destinatarios |
|-------------|-----------|---------------|
| Lead nuevo | lead.created | recipients configurados en notification-prefs |
| Ingesta fallida | ingestion.failed | Admin del tenant |
| Confianza baja | confidence < threshold | Admin del tenant (configurable) |
| Resumen semanal | Cron domingo 8:00 | Admin del tenant |

**Template de email (lead nuevo):**
```
Asunto: Nuevo lead en [Bot Name] — [Tenant Name]
Cuerpo:
  Has recibido un nuevo lead de tu chatbot.

  Nombre: Ana García
  Email: ana@empresa.com
  Empresa: Empresa S.L.
  Mensaje: "Me interesa el plan Enterprise"

  Ver conversación completa: https://app.talkaris.com/app/conversations/UUID

  [Gestionar notificaciones]
```

---

## 5. Developer Integrations

### REST API con API Keys (v1.5)

Una vez obtenida una API key del portal:

```bash
# Listar conversaciones
curl -H "X-Talkaris-Key: tk_live_xxx" \
  https://api.talkaris.com/v1/portal/tenants/TENANT_ID/conversations

# Exportar leads
curl -H "X-Talkaris-Key: tk_live_xxx" \
  "https://api.talkaris.com/v1/portal/tenants/TENANT_ID/export/leads?format=json&from=2026-01-01"

# Disparar ingesta
curl -X POST -H "X-Talkaris-Key: tk_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{"sourceId": "UUID"}' \
  https://api.talkaris.com/v1/portal/tenants/TENANT_ID/ingestions
```

**Rate limits por API key:**
- 100 req/min (standard)
- 1000 req/min (enterprise, configurable)

---

### Widget JavaScript API (v1 — ya disponible)

El widget expone una API JS para uso avanzado:

```javascript
// Abrir el widget programáticamente
window.TalkarisWidget.open();

// Cerrar el widget
window.TalkarisWidget.close();

// Enviar mensaje automático al abrirse
window.TalkarisWidget.prefillMessage("¿Cómo me registro?");

// Escuchar eventos
window.addEventListener("talkaris:lead_submitted", (e) => {
  console.log("Lead:", e.detail);
});
window.addEventListener("talkaris:cta_clicked", (e) => {
  console.log("CTA:", e.detail.url);
});
```

---

## 6. Seguridad en Integraciones

### Verificación de Webhooks

Para verificar que un webhook viene de Talkaris:

```javascript
const crypto = require('crypto');

function verifyTalkarisWebhook(req, secret) {
  const sigHeader = req.headers['x-talkaris-signature'];
  const [ts, sig] = sigHeader.split(',').map(p => p.split('=')[1]);

  // Evitar replay attacks: verificar timestamp (máx 5 min de tolerancia)
  if (Math.abs(Date.now() / 1000 - parseInt(ts)) > 300) return false;

  const payload = `${ts}.${JSON.stringify(req.body)}`;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}
```

### Rotación de Secrets

- **API Keys:** Revocar la key anterior y crear una nueva desde el portal.
- **Webhook secrets:** Actualizar el webhook en el portal con un nuevo secret; el sistema aceptará ambos durante una ventana de 5 minutos para rotación sin downtime.
- **Integraciones OAuth (HubSpot etc.):** Los tokens se rotan automáticamente antes de expirar.

---

## 7. Matriz de Integraciones por Versión

| Integración | v1 (Hoy) | v1.5 | v2 | v3 | Futuro |
|-------------|----------|------|-----|-----|--------|
| Web Widget | ✅ | ✅ | ✅ | ✅ | - |
| Webhook genérico (leads) | ✅ | ✅ | ✅ | ✅ | - |
| Webhooks generalizados | - | ✅ | ✅ | ✅ | - |
| API Keys para tenants | - | ✅ | ✅ | ✅ | - |
| YouTube transcripts | - | - | ✅ | ✅ | - |
| Notion | - | - | ✅ | ✅ | - |
| Zendesk Help Center | - | - | ✅ | ✅ | - |
| API Endpoint custom | - | - | ✅ | ✅ | - |
| Google Drive | - | - | ✅ | ✅ | - |
| HubSpot nativo | - | - | ✅ | ✅ | - |
| Notificaciones email | - | ✅ | ✅ | ✅ | - |
| Exports (CSV/JSON) | - | ✅ | ✅ | ✅ | - |
| Slack App | - | - | - | ✅ | - |
| WhatsApp Business | - | - | - | ✅ | - |
| Zapier/Make connector | - | - | - | ✅ | - |
| Salesforce | - | - | - | ✅ | - |
| Microsoft Teams | - | - | - | ✅ | - |
| Confluence | - | - | - | ✅ | - |
| Messenger/Instagram | - | - | - | ✅ | - |
| Shopify | - | - | - | - | ✅ |
| Voice/Twilio | - | - | - | - | ✅ |
| Mobile SDK | - | - | - | - | ✅ |
