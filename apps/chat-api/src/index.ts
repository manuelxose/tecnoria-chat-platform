import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import {
  buildFallbackAnswer,
  CTAConfig,
  ChatAnswer,
  LeadSinkConfig,
  ProjectRecord,
  PromptPolicy,
  scoreCommercialIntent,
  selectTopChunks,
  SourceRecord,
  WidgetTheme,
} from "@tecnoria-chat/core";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(4101),
  DATABASE_URL: z.string().min(1),
  CORS_ORIGIN: z.string().default("http://localhost:4200,http://localhost:4102,http://localhost:4000"),
  ADMIN_BEARER_TOKEN: z.string().min(1),
  LEAD_WEBHOOK_SHARED_SECRET: z.string().min(1),
  DEFAULT_LEAD_WEBHOOK_URL: z.string().url().default("http://localhost:3001/api/v1/contact"),
});

const env = envSchema.parse(process.env);
const pool = new Pool({ connectionString: env.DATABASE_URL });
const app = express();
const allowedOrigins = env.CORS_ORIGIN.split(",").map((item) => item.trim()).filter(Boolean);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: allowedOrigins, credentials: false }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

const defaultPromptPolicy: PromptPolicy = {
  tone: "profesional, sobrio y orientado a negocio",
  outOfScopeMessage:
    "No tengo contexto suficiente para responder eso con seguridad. Si quieres, puedo orientarte a la pagina adecuada o llevarte a contacto.",
  guardrails: [
    "No inventar servicios",
    "No inventar precios",
    "No salir del dominio de conocimiento autorizado",
  ],
  disallowPricing: true,
};

const defaultCtaConfig: CTAConfig = {
  primaryLabel: "Pedir reunion",
  primaryUrl: "https://tecnoriasl.com/contacto",
  secondaryLabel: "Ver servicios",
  secondaryUrl: "https://tecnoriasl.com/servicios",
  salesKeywords: ["precio", "presupuesto", "contacto", "reunion", "propuesta", "contratar"],
};

type RetrievedChunk = {
  chunkId: string;
  documentId: string;
  score: number | string;
  heading: string | null;
  body: string;
  canonicalUrl: string;
  title: string;
  category: string | null;
};

const defaultWidgetTheme: WidgetTheme = {
  accentColor: "#00c2a8",
  surfaceColor: "#09111f",
  textColor: "#f5f7fb",
  launcherLabel: "Hablar con el asistente",
};

function normalizeProject(row: any): ProjectRecord {
  return {
    id: row.id,
    projectKey: row.project_key,
    name: row.name,
    siteKey: row.site_key,
    language: row.language,
    allowedDomains: row.allowed_domains ?? [],
    botName: row.bot_name,
    welcomeMessage: row.welcome_message,
    promptPolicy: { ...defaultPromptPolicy, ...(row.prompt_policy ?? {}) },
    ctaConfig: { ...defaultCtaConfig, ...(row.cta_config ?? {}) },
    widgetTheme: { ...defaultWidgetTheme, ...(row.widget_theme ?? {}) },
    leadSink: {
      mode: "webhook",
      webhookUrl: row.lead_sink?.webhookUrl ?? env.DEFAULT_LEAD_WEBHOOK_URL,
      secretHeaderName: row.lead_sink?.secretHeaderName ?? "x-tecnoria-chat-secret",
    },
  };
}

async function getProjectBySiteKey(siteKey: string): Promise<ProjectRecord | null> {
  const result = await pool.query("SELECT * FROM projects WHERE site_key = $1 LIMIT 1", [siteKey]);
  return result.rowCount ? normalizeProject(result.rows[0]) : null;
}

async function getProjectByKey(projectKey: string): Promise<ProjectRecord | null> {
  const result = await pool.query("SELECT * FROM projects WHERE project_key = $1 LIMIT 1", [projectKey]);
  return result.rowCount ? normalizeProject(result.rows[0]) : null;
}

async function getSource(projectId: string, sourceKey: string): Promise<SourceRecord | null> {
  const result = await pool.query("SELECT * FROM sources WHERE project_id = $1 AND source_key = $2 LIMIT 1", [projectId, sourceKey]);
  if (!result.rowCount) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    projectId: row.project_id,
    sourceKey: row.source_key,
    kind: row.kind,
    entryUrl: row.entry_url,
    includePatterns: row.include_patterns ?? [],
    excludePatterns: row.exclude_patterns ?? [],
    allowedDomains: row.allowed_domains ?? [],
    visibility: row.visibility,
    defaultCategory: row.default_category ?? undefined,
  };
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (token !== env.ADMIN_BEARER_TOKEN) {
    res.status(401).json({ code: "UNAUTHORIZED", message: "Admin token required" });
    return;
  }
  next();
}

function isOriginAllowed(project: ProjectRecord, origin?: string): boolean {
  if (!origin || project.allowedDomains.length === 0) {
    return true;
  }

  try {
    const host = new URL(origin).hostname;
    if (env.NODE_ENV !== "production" && (host === "localhost" || host === "127.0.0.1")) {
      return true;
    }
    return project.allowedDomains.some((domain: string) => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

async function logAnalytics(projectId: string, conversationId: string | null, eventType: string, payload: Record<string, unknown>): Promise<void> {
  await pool.query(
    `INSERT INTO analytics_events (project_id, conversation_id, event_type, payload)
     VALUES ($1, $2, $3, $4::jsonb)`,
    [projectId, conversationId, eventType, JSON.stringify(payload)]
  );
}

function summarizeText(body: string): string {
  const cleaned = body.replace(/\s+/g, " ").trim();
  const sentences = cleaned.match(/[^.!?]+[.!?]?/g) ?? [cleaned];
  return sentences.slice(0, 2).join(" ").trim();
}

function composeAnswer(project: ProjectRecord, userMessage: string, chunks: RetrievedChunk[]): ChatAnswer {
  if (!chunks.length || Number(chunks[0].score) < 0.03) {
    return buildFallbackAnswer(project);
  }

  const topChunks = selectTopChunks(chunks.map((chunk: RetrievedChunk) => ({ ...chunk, score: Number(chunk.score) })), 4);
  const uniqueParagraphs: string[] = [];
  for (const chunk of topChunks) {
    const sentence = summarizeText(chunk.body);
    if (sentence && !uniqueParagraphs.includes(sentence)) {
      uniqueParagraphs.push(sentence);
    }
    if (uniqueParagraphs.length === 3) {
      break;
    }
  }

  const commercialIntent = scoreCommercialIntent(userMessage, project.ctaConfig.salesKeywords);
  const message = [
    uniqueParagraphs[0] ?? "He encontrado informacion relevante en el conocimiento autorizado.",
    uniqueParagraphs.slice(1).join(" "),
    commercialIntent > 0 ? "Si quieres, puedo orientarte al siguiente paso comercial adecuado." : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const citations = topChunks.slice(0, 3).map((chunk: RetrievedChunk) => ({
    title: chunk.title,
    url: chunk.canonicalUrl,
    snippet: summarizeText(chunk.body),
  }));

  return {
    message,
    citations,
    cta: commercialIntent > 0
      ? {
          label: project.ctaConfig.primaryLabel,
          url: project.ctaConfig.primaryUrl,
        }
      : undefined,
    confidence: Math.min(0.95, 0.45 + Number(topChunks[0].score)),
    usedFallback: false,
  };
}

async function retrieveChunks(projectId: string, userMessage: string): Promise<any[]> {
  const query = `
    SELECT
      c.id AS "chunkId",
      c.document_id AS "documentId",
      ts_rank_cd(c.search_vector, websearch_to_tsquery('simple', $2))::float AS score,
      c.heading,
      c.body,
      d.canonical_url AS "canonicalUrl",
      d.title,
      d.category
    FROM chunks c
    INNER JOIN documents d ON d.id = c.document_id
    INNER JOIN document_versions dv ON dv.id = c.document_version_id
    WHERE c.project_id = $1
      AND dv.version_no = d.current_version
      AND c.search_vector @@ websearch_to_tsquery('simple', $2)
    ORDER BY score DESC
    LIMIT 8
  `;

  const result = await pool.query(query, [projectId, userMessage]);
  if (result.rowCount) {
    return result.rows;
  }

  const fallback = await pool.query(
    `
      SELECT
        c.id AS "chunkId",
        c.document_id AS "documentId",
        0.05::float AS score,
        c.heading,
        c.body,
        d.canonical_url AS "canonicalUrl",
        d.title,
        d.category
      FROM chunks c
      INNER JOIN documents d ON d.id = c.document_id
      INNER JOIN document_versions dv ON dv.id = c.document_version_id
      WHERE c.project_id = $1
        AND dv.version_no = d.current_version
        AND (d.title ILIKE $2 OR d.canonical_url ILIKE $2)
      ORDER BY d.updated_at DESC
      LIMIT 5
    `,
    [projectId, `%${userMessage}%`]
  );
  return fallback.rows;
}

async function deliverLead(project: ProjectRecord, payload: Record<string, unknown>): Promise<{ status: string; response: unknown }> {
  const sink: LeadSinkConfig = project.leadSink;
  try {
    const response = await fetch(sink.webhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        [sink.secretHeaderName]: env.LEAD_WEBHOOK_SHARED_SECRET,
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    return {
      status: response.ok ? "delivered" : "failed",
      response: {
        status: response.status,
        body: text.slice(0, 1000),
      },
    };
  } catch (error) {
    return {
      status: "failed",
      response: {
        error: error instanceof Error ? error.message : "unknown error",
      },
    };
  }
}

const createProjectSchema = z.object({
  projectKey: z.string().min(2),
  name: z.string().min(2),
  language: z.string().default("es"),
  allowedDomains: z.array(z.string()).default([]),
  botName: z.string().default("RIA"),
  welcomeMessage: z.string().default("Hola. Soy el asistente de Tecnoria. Puedo ayudarte con servicios, procesos y contacto."),
  promptPolicy: z.any().optional(),
  ctaConfig: z.any().optional(),
  widgetTheme: z.any().optional(),
  leadSink: z.any().optional(),
  siteKey: z.string().min(6).optional(),
});

const sourceSchema = z.object({
  projectKey: z.string().min(2),
  sourceKey: z.string().min(2),
  kind: z.enum(["sitemap", "html", "pdf", "markdown"]),
  entryUrl: z.string().url(),
  includePatterns: z.array(z.string()).default([]),
  excludePatterns: z.array(z.string()).default([]),
  allowedDomains: z.array(z.string()).default([]),
  visibility: z.enum(["public", "private"]).default("public"),
  defaultCategory: z.string().optional(),
});

const ingestionSchema = z.object({
  projectKey: z.string().min(2),
  sourceKey: z.string().min(2),
  requestedBy: z.string().optional(),
});

const sessionSchema = z.object({
  siteKey: z.string().min(6),
  origin: z.string().optional(),
});

const messageSchema = z.object({
  conversationId: z.string().uuid(),
  message: z.string().min(2).max(2000),
});

const leadSchema = z.object({
  conversationId: z.string().uuid(),
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().optional(),
  phone: z.string().optional(),
  need: z.string().min(5),
});

const eventSchema = z.object({
  conversationId: z.string().uuid(),
  eventType: z.enum(["citation_clicked", "cta_clicked"]),
  payload: z.record(z.any()).default({}),
});

app.get("/health", async (_req, res) => {
  const dbNow = await pool.query("SELECT NOW() AS now");
  res.json({ ok: true, service: "chat-api", db: dbNow.rows[0].now });
});

app.get("/v1/widget/config/:siteKey", async (req, res) => {
  const project = await getProjectBySiteKey(req.params.siteKey);
  if (!project) {
    res.status(404).json({ code: "NOT_FOUND", message: "Project not found" });
    return;
  }

  res.json({
    projectKey: project.projectKey,
    siteKey: project.siteKey,
    botName: project.botName,
    welcomeMessage: project.welcomeMessage,
    theme: project.widgetTheme,
    cta: project.ctaConfig,
    promptPolicy: {
      tone: project.promptPolicy.tone,
      outOfScopeMessage: project.promptPolicy.outOfScopeMessage,
    },
  });
});

app.post("/v1/widget/sessions", async (req, res) => {
  const parsed = sessionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: "INVALID_INPUT", issues: parsed.error.flatten() });
    return;
  }

  const project = await getProjectBySiteKey(parsed.data.siteKey);
  if (!project || !isOriginAllowed(project, parsed.data.origin)) {
    res.status(403).json({ code: "FORBIDDEN", message: "Origin not allowed" });
    return;
  }

  const insert = await pool.query(
    `INSERT INTO conversations (project_id, site_key, origin, user_agent)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [project.id, project.siteKey, parsed.data.origin ?? null, req.headers["user-agent"] ?? null]
  );

  await logAnalytics(project.id, insert.rows[0].id, "widget_opened", {
    origin: parsed.data.origin ?? null,
  });

  res.status(201).json({
    conversationId: insert.rows[0].id,
    botName: project.botName,
    welcomeMessage: project.welcomeMessage,
  });
});

app.post("/v1/widget/messages", async (req, res) => {
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: "INVALID_INPUT", issues: parsed.error.flatten() });
    return;
  }

  const conversation = await pool.query(
    `SELECT c.id, c.project_id, p.*
     FROM conversations c
     INNER JOIN projects p ON p.id = c.project_id
     WHERE c.id = $1
     LIMIT 1`,
    [parsed.data.conversationId]
  );

  if (!conversation.rowCount) {
    res.status(404).json({ code: "NOT_FOUND", message: "Conversation not found" });
    return;
  }

  const row = conversation.rows[0];
  const project = normalizeProject(row);

  await pool.query(
    `INSERT INTO messages (conversation_id, project_id, role, body)
     VALUES ($1, $2, 'user', $3)`,
    [parsed.data.conversationId, project.id, parsed.data.message]
  );
  await logAnalytics(project.id, parsed.data.conversationId, "message_sent", { message: parsed.data.message });

  const chunks = await retrieveChunks(project.id, parsed.data.message);
  const answer = composeAnswer(project, parsed.data.message, chunks);

  await pool.query(
    `INSERT INTO messages (conversation_id, project_id, role, body, citations, confidence)
     VALUES ($1, $2, 'assistant', $3, $4::jsonb, $5)`,
    [parsed.data.conversationId, project.id, answer.message, JSON.stringify(answer.citations), answer.confidence]
  );
  await logAnalytics(project.id, parsed.data.conversationId, answer.usedFallback ? "fallback" : "response_served", {
    confidence: answer.confidence,
    citations: answer.citations.map((item: { url: string }) => item.url),
  });
  if (answer.usedFallback) {
    await logAnalytics(project.id, parsed.data.conversationId, "no_answer", { message: parsed.data.message });
  }

  res.setHeader("content-type", "text/event-stream; charset=utf-8");
  res.setHeader("cache-control", "no-cache, no-transform");
  res.setHeader("connection", "keep-alive");
  res.write(`data: ${JSON.stringify({ type: "answer", payload: answer })}\n\n`);
  res.end();
});

app.post("/v1/widget/leads", async (req, res) => {
  const parsed = leadSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: "INVALID_INPUT", issues: parsed.error.flatten() });
    return;
  }

  const conversation = await pool.query(
    `SELECT c.id, c.project_id, p.*
     FROM conversations c
     INNER JOIN projects p ON p.id = c.project_id
     WHERE c.id = $1
     LIMIT 1`,
    [parsed.data.conversationId]
  );

  if (!conversation.rowCount) {
    res.status(404).json({ code: "NOT_FOUND", message: "Conversation not found" });
    return;
  }

  const project = normalizeProject(conversation.rows[0]);
  const payload = {
    name: parsed.data.name,
    email: parsed.data.email,
    company: parsed.data.company,
    phone: parsed.data.phone,
    message: parsed.data.need,
    service1: "Chatbot web corporativa",
    service2: `conversation:${parsed.data.conversationId}`,
  };

  const delivery = await deliverLead(project, payload);
  const insert = await pool.query(
    `INSERT INTO lead_events (project_id, conversation_id, payload, delivery_status, delivery_response)
     VALUES ($1, $2, $3::jsonb, $4, $5::jsonb)
     RETURNING id`,
    [project.id, parsed.data.conversationId, JSON.stringify(payload), delivery.status, JSON.stringify(delivery.response)]
  );

  await logAnalytics(project.id, parsed.data.conversationId, "lead_submitted", {
    leadEventId: insert.rows[0].id,
    deliveryStatus: delivery.status,
  });

  res.status(202).json({ leadEventId: insert.rows[0].id, deliveryStatus: delivery.status });
});

app.post("/v1/widget/events", async (req, res) => {
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: "INVALID_INPUT", issues: parsed.error.flatten() });
    return;
  }

  const conversation = await pool.query(
    `SELECT project_id FROM conversations WHERE id = $1 LIMIT 1`,
    [parsed.data.conversationId]
  );
  if (!conversation.rowCount) {
    res.status(404).json({ code: "NOT_FOUND", message: "Conversation not found" });
    return;
  }

  await logAnalytics(conversation.rows[0].project_id, parsed.data.conversationId, parsed.data.eventType, parsed.data.payload);
  res.status(202).json({ ok: true });
});

app.post("/v1/integrations/webhooks/leads", async (req, res) => {
  const projectKey = String(req.query.projectKey ?? "");
  const project = projectKey ? await getProjectByKey(projectKey) : null;
  if (!project) {
    res.status(404).json({ code: "NOT_FOUND", message: "Project not found" });
    return;
  }

  await logAnalytics(project.id, null, "lead_submitted", {
    source: "integration_webhook",
    payload: req.body,
  });

  res.status(202).json({ ok: true });
});

app.post("/v1/admin/projects", requireAdmin, async (req, res) => {
  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: "INVALID_INPUT", issues: parsed.error.flatten() });
    return;
  }

  const payload = parsed.data;
  const siteKey = payload.siteKey ?? randomUUID();
  const result = await pool.query(
    `INSERT INTO projects (
       project_key,
       name,
       site_key,
       language,
       allowed_domains,
       bot_name,
       welcome_message,
       prompt_policy,
       cta_config,
       widget_theme,
       lead_sink
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10::jsonb, $11::jsonb)
     ON CONFLICT (project_key)
     DO UPDATE SET
       name = EXCLUDED.name,
       site_key = EXCLUDED.site_key,
       language = EXCLUDED.language,
       allowed_domains = EXCLUDED.allowed_domains,
       bot_name = EXCLUDED.bot_name,
       welcome_message = EXCLUDED.welcome_message,
       prompt_policy = EXCLUDED.prompt_policy,
       cta_config = EXCLUDED.cta_config,
       widget_theme = EXCLUDED.widget_theme,
       lead_sink = EXCLUDED.lead_sink,
       updated_at = NOW()
     RETURNING *`,
    [
      payload.projectKey,
      payload.name,
      siteKey,
      payload.language,
      payload.allowedDomains,
      payload.botName,
      payload.welcomeMessage,
      JSON.stringify(payload.promptPolicy ?? defaultPromptPolicy),
      JSON.stringify(payload.ctaConfig ?? defaultCtaConfig),
      JSON.stringify(payload.widgetTheme ?? defaultWidgetTheme),
      JSON.stringify(
        payload.leadSink ?? {
          mode: "webhook",
          webhookUrl: env.DEFAULT_LEAD_WEBHOOK_URL,
          secretHeaderName: "x-tecnoria-chat-secret",
        }
      ),
    ]
  );

  res.status(201).json(normalizeProject(result.rows[0]));
});

app.post("/v1/admin/sources", requireAdmin, async (req, res) => {
  const parsed = sourceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: "INVALID_INPUT", issues: parsed.error.flatten() });
    return;
  }

  const project = await getProjectByKey(parsed.data.projectKey);
  if (!project) {
    res.status(404).json({ code: "NOT_FOUND", message: "Project not found" });
    return;
  }

  const result = await pool.query(
    `INSERT INTO sources (
       project_id, source_key, kind, entry_url, include_patterns, exclude_patterns, allowed_domains, visibility, default_category
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (project_id, source_key)
     DO UPDATE SET
       kind = EXCLUDED.kind,
       entry_url = EXCLUDED.entry_url,
       include_patterns = EXCLUDED.include_patterns,
       exclude_patterns = EXCLUDED.exclude_patterns,
       allowed_domains = EXCLUDED.allowed_domains,
       visibility = EXCLUDED.visibility,
       default_category = EXCLUDED.default_category,
       updated_at = NOW()
     RETURNING *`,
    [
      project.id,
      parsed.data.sourceKey,
      parsed.data.kind,
      parsed.data.entryUrl,
      parsed.data.includePatterns,
      parsed.data.excludePatterns,
      parsed.data.allowedDomains,
      parsed.data.visibility,
      parsed.data.defaultCategory ?? null,
    ]
  );

  res.status(201).json(result.rows[0]);
});

app.post("/v1/admin/ingestions", requireAdmin, async (req, res) => {
  const parsed = ingestionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ code: "INVALID_INPUT", issues: parsed.error.flatten() });
    return;
  }

  const project = await getProjectByKey(parsed.data.projectKey);
  if (!project) {
    res.status(404).json({ code: "NOT_FOUND", message: "Project not found" });
    return;
  }

  const source = await getSource(project.id, parsed.data.sourceKey);
  if (!source) {
    res.status(404).json({ code: "NOT_FOUND", message: "Source not found" });
    return;
  }

  const result = await pool.query(
    `INSERT INTO ingestion_jobs (project_id, source_id, status, requested_by)
     VALUES ($1, $2, 'queued', $3)
     RETURNING id, status, created_at AS "createdAt"`,
    [project.id, source.id, parsed.data.requestedBy ?? "ops-cli"]
  );

  res.status(201).json(result.rows[0]);
});

app.get("/v1/admin/ingestions/:id", requireAdmin, async (req, res) => {
  const result = await pool.query(
    `SELECT id, project_id AS "projectId", source_id AS "sourceId", status, summary, error_text AS "errorText", created_at AS "createdAt", started_at AS "startedAt", finished_at AS "finishedAt"
     FROM ingestion_jobs
     WHERE id = $1
     LIMIT 1`,
    [req.params.id]
  );

  if (!result.rowCount) {
    res.status(404).json({ code: "NOT_FOUND", message: "Ingestion not found" });
    return;
  }

  res.json(result.rows[0]);
});

app.post("/v1/admin/evals", requireAdmin, async (req, res) => {
  const projectKey = String(req.body?.projectKey ?? "");
  const project = await getProjectByKey(projectKey);
  if (!project) {
    res.status(404).json({ code: "NOT_FOUND", message: "Project not found" });
    return;
  }

  const prompts = [
    "Que hace Tecnoria",
    "Ofreceis chatbots para empresas",
    "Como puedo pedir presupuesto",
    "Trabajais automatizacion de procesos",
  ];

  const results = [];
  for (const prompt of prompts) {
    const chunks = await retrieveChunks(project.id, prompt);
    results.push({
      prompt,
      hits: chunks.length,
      topUrl: chunks[0]?.canonicalUrl ?? null,
      passed: chunks.length > 0,
    });
  }

  res.json({
    projectKey,
    coverage: results.filter((item) => item.passed).length / results.length,
    results,
  });
});

app.get("/v1/admin/analytics/summary", requireAdmin, async (req, res) => {
  const projectKey = String(req.query.projectKey ?? "");
  const project = await getProjectByKey(projectKey);
  if (!project) {
    res.status(404).json({ code: "NOT_FOUND", message: "Project not found" });
    return;
  }

  const events = await pool.query(
    `SELECT event_type AS "eventType", COUNT(*)::int AS total
     FROM analytics_events
     WHERE project_id = $1
     GROUP BY event_type
     ORDER BY total DESC`,
    [project.id]
  );
  const unanswered = await pool.query(
    `SELECT payload->>'message' AS message, COUNT(*)::int AS total
     FROM analytics_events
     WHERE project_id = $1
       AND event_type = 'no_answer'
     GROUP BY payload->>'message'
     ORDER BY total DESC
     LIMIT 10`,
    [project.id]
  );
  const leads = await pool.query(
    `SELECT delivery_status AS "deliveryStatus", COUNT(*)::int AS total
     FROM lead_events
     WHERE project_id = $1
     GROUP BY delivery_status`,
    [project.id]
  );

  res.json({
    projectKey,
    events: events.rows,
    unanswered: unanswered.rows,
    leads: leads.rows,
  });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  res.status(500).json({ code: "INTERNAL_ERROR", message });
});

app.listen(env.PORT, () => {
  console.log(`chat-api listening on http://localhost:${env.PORT}`);
});




