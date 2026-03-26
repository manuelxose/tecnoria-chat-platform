import express, { NextFunction, Request, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { CrawlWebsiteUseCase } from "@tecnoria-chat/application";
import { CheerioCrawler } from "@tecnoria-chat/infrastructure";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { app, env, pool } from "./runtime-base.js";
import {
  buildCanonicalWidgetSnippet,
  canonicalWebsiteSourceKey,
  discoverWebsiteEntry,
  inferAllowedDomains,
  normalizeWebsiteBaseUrl,
} from "./website-integration.js";

type PlatformRole = "superadmin" | "member";
type TenantRole = "admin" | "editor" | "viewer";

type SessionClaims = {
  sub: string;
  email: string;
  platformRole: PlatformRole;
};

type PortalMembership = {
  tenantId: string;
  role: TenantRole;
};

type PortalUser = {
  id: string;
  email: string;
  platformRole: PlatformRole;
  status: "pending" | "active" | "disabled";
  memberships: PortalMembership[];
};

type PortalRequest = Request & { portalUser?: PortalUser };

type DbRow = Record<string, any>;
type ChannelKind = "telegram" | "whatsapp";

type PromptPolicy = {
  tone: string;
  outOfScopeMessage: string;
  guardrails: string[];
  disallowPricing: boolean;
};

type CTAConfig = {
  primaryLabel: string;
  primaryUrl: string;
  secondaryLabel?: string;
  secondaryUrl?: string;
  salesKeywords: string[];
};

type WidgetTheme = {
  presetKey?: "indigo" | "violet" | "midnight" | "aurora";
  accentColor: string;
  surfaceColor: string;
  textColor: string;
  launcherLabel: string;
  launcherEyebrow?: string;
  launcherIcon?: string;
  launcherShape?: "pill" | "rounded" | "compact";
  buttonStyle?: "solid" | "glass" | "outline";
  botCopy?: string;
  logoUrl?: string;
  removeBranding?: boolean;
  proactiveMessage?: string;
  proactiveDelaySeconds?: number;
  composerPlaceholder?: string;
  sendButtonLabel?: string;
};

type AssistantProfile = {
  positioningStatement: string;
  serviceCatalog: string[];
  qualificationGoals: string[];
  nextStepRules: string[];
  servicePromptLibrary: string[];
};

type RuntimePolicy = {
  posture: string;
  scope: string;
  roadmapDepth: string;
  maxMobileSuggestions: number;
  maxDesktopSuggestions: number;
  commercialIntentThreshold: number;
  hideStartersAfterFirstUserMessage: boolean;
};

type AiConfig = {
  provider?: "openai" | "anthropic" | "deepseek" | "google" | "local";
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPromptAdditions?: string;
};

type ProjectRecord = {
  id: string;
  tenantId: string;
  projectKey: string;
  name: string;
  siteKey: string;
  status: "active" | "draft" | "disabled";
  publicBaseUrl: string | null;
  metadata: Record<string, unknown>;
  language: string;
  allowedDomains: string[];
  botName: string;
  welcomeMessage: string;
  promptPolicy: PromptPolicy;
  ctaConfig: CTAConfig;
  widgetTheme: WidgetTheme;
  enableHandover: boolean;
  aiConfig: AiConfig;
  languageMode: "fixed" | "auto";
  starterQuestions: string[];
  assistantProfile: AssistantProfile;
  runtimePolicy: RuntimePolicy;
};

type WidgetSuggestionItem = {
  label: string;
  prompt: string;
  kind: "service" | "qualification" | "follow_up" | "contact";
};

type WidgetSuggestionBlock = {
  slot: "follow_up" | "services" | "qualification";
  items: WidgetSuggestionItem[];
};

type WidgetCitation = {
  title: string;
  url: string;
  snippet: string;
};

type WidgetAnswer = {
  message: string;
  citations: WidgetCitation[];
  cta?: {
    label: string;
    url: string;
  };
  confidence: number;
  usedFallback: boolean;
  suggestions?: WidgetSuggestionBlock;
};

type RetrievedChunk = {
  chunkId: string;
  documentId: string;
  score: number;
  heading?: string | null;
  body: string;
  canonicalUrl: string;
  title: string;
  category?: string | null;
};

type UploadedAsset = {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  sourceKey?: string;
  jobId?: string;
};
const crawlUseCase = new CrawlWebsiteUseCase(new CheerioCrawler());

const CrawlSchema = z.object({
  url: z.string().url(),
});

const ProjectUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  status: z.enum(["active", "draft", "disabled"]).optional(),
  language: z.string().min(2).optional(),
  languageMode: z.enum(["fixed", "auto"]).optional(),
  botName: z.string().min(1).optional(),
  allowedDomains: z.array(z.string()).optional(),
  publicBaseUrl: z.union([z.string().url(), z.null()]).optional(),
  welcomeMessage: z.string().min(2).optional(),
  promptPolicy: z.object({
    tone: z.string().min(1).optional(),
    outOfScopeMessage: z.string().min(1).optional(),
    guardrails: z.array(z.string().min(1)).optional(),
    disallowPricing: z.boolean().optional(),
  }).optional(),
  ctaConfig: z.object({
    primaryLabel: z.string().min(1).optional(),
    primaryUrl: z.string().url().optional(),
    secondaryLabel: z.string().min(1).optional(),
    secondaryUrl: z.union([z.string().url(), z.literal("")]).optional(),
    salesKeywords: z.array(z.string().min(1)).optional(),
  }).optional(),
  widgetTheme: z.object({
    presetKey: z.enum(["indigo", "violet", "midnight", "aurora"]).optional(),
    accentColor: z.string().min(4).optional(),
    surfaceColor: z.string().min(4).optional(),
    textColor: z.string().min(4).optional(),
    launcherLabel: z.string().optional(),
    launcherEyebrow: z.string().optional(),
    launcherIcon: z.string().optional(),
    launcherShape: z.enum(["pill", "rounded", "compact"]).optional(),
    buttonStyle: z.enum(["solid", "glass", "outline"]).optional(),
    botCopy: z.string().optional(),
    logoUrl: z.union([z.string().url(), z.literal("")]).optional(),
    removeBranding: z.boolean().optional(),
    proactiveMessage: z.union([z.string().min(1), z.literal("")]).optional(),
    proactiveDelaySeconds: z.coerce.number().min(0).max(120).optional(),
    composerPlaceholder: z.string().optional(),
    sendButtonLabel: z.string().optional(),
  }).optional(),
  enableHandover: z.boolean().optional(),
  aiConfig: z.object({
    provider: z.enum(["openai", "anthropic", "deepseek", "google", "local"]).optional(),
    model: z.string().min(1).optional(),
    temperature: z.coerce.number().min(0).max(2).optional(),
    maxTokens: z.coerce.number().int().min(1).max(8000).optional(),
    systemPromptAdditions: z.string().optional(),
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
  starterQuestions: z.array(z.string().trim().min(1)).max(12).optional(),
});

const WidgetSessionSchema = z.object({
  siteKey: z.string().min(6),
  origin: z.string().optional(),
  detectedLanguage: z.string().max(10).optional(),
});

const WidgetMessageSchema = z.object({
  conversationId: z.string().uuid(),
  message: z.string().min(2).max(2000),
});

const WebsiteIntegrationSchema = z.object({
  baseUrl: z.string().url(),
});

const defaultPromptPolicy: PromptPolicy = {
  tone: "profesional, sobrio y orientado a negocio",
  outOfScopeMessage:
    "No tengo contexto suficiente para responder eso con seguridad. Si quieres, puedo orientarte a la funcionalidad adecuada o a solicitar una demo.",
  guardrails: [
    "No inventar servicios",
    "No inventar precios",
    "No salir del dominio de conocimiento autorizado",
  ],
  disallowPricing: true,
};

const defaultCtaConfig: CTAConfig = {
  primaryLabel: "Solicitar demo",
  primaryUrl: "https://talkaris.com/solicitar-demo",
  secondaryLabel: "Ver funcionalidades",
  secondaryUrl: "https://talkaris.com/funcionalidades",
  salesKeywords: ["precio", "presupuesto", "contacto", "demo", "reunion", "contratar"],
};

const defaultWidgetTheme: WidgetTheme = {
  presetKey: "indigo",
  accentColor: "#6366f1",
  surfaceColor: "#0f172a",
  textColor: "#f8fafc",
  launcherLabel: "Hablar con el asistente",
  launcherShape: "pill",
  buttonStyle: "solid",
  composerPlaceholder: "Pregunta sobre el producto, integraciones o soporte.",
  sendButtonLabel: "Enviar",
};

const tecnoriaServiceCatalog = [
  "Desarrollo software a medida",
  "Automatización de procesos",
  "Desarrollo de chatbots para empresas",
  "IA para equipos operativos",
  "Plataformas SaaS",
  "Consultoría tecnológica",
];

const tecnoriaPromptLibrary = [
  "Necesito automatizar un proceso interno y quiero valorar opciones.",
  "Quiero estudiar un desarrollo software a medida para mi operación.",
  "Busco un chatbot empresarial para ventas, soporte u operaciones.",
  "Quiero integrar IA en un flujo real de mi equipo.",
  "Necesito validar un producto SaaS o una plataforma interna.",
  "Quiero hablar con el equipo sobre mi caso.",
];

const looseSearchStopWords = new Set([
  "como",
  "cual",
  "cuales",
  "cuanto",
  "cuantos",
  "donde",
  "hace",
  "hacen",
  "haceis",
  "para",
  "porque",
  "puede",
  "pueden",
  "puedo",
  "que",
  "quien",
  "quienes",
  "sobre",
  "trabajais",
  "teneis",
]);

const publicPortalUrl = (process.env["PORTAL_PUBLIC_URL"] ?? "http://localhost:4103").replace(/\/$/, "");
const publicApiBase = `${publicPortalUrl}/api`;
const uploadsRoot = path.resolve(process.env["CHAT_API_UPLOAD_DIR"] ?? "/tmp/talkaris-chat/uploads");
const assetsRoot = path.join(uploadsRoot, "assets");

await fs.mkdir(path.join(assetsRoot, "logos"), { recursive: true });
await fs.mkdir(path.join(assetsRoot, "documents"), { recursive: true });

app.use("/v1/assets", express.static(assetsRoot, {
  fallthrough: false,
  immutable: true,
  maxAge: "30d",
}));

const uploadParser = express.raw({
  type: "*/*",
  limit: "24mb",
});

const channelCreateSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("telegram"),
    botToken: z.string().min(16),
    label: z.string().trim().min(1).max(80).optional(),
  }),
  z.object({
    kind: z.literal("whatsapp"),
    label: z.string().trim().min(1).max(80).optional(),
    accessToken: z.string().min(16),
    phoneNumberId: z.string().min(4),
    businessAccountId: z.string().trim().min(1).optional(),
    verifyToken: z.string().trim().min(8).max(120),
    appSecret: z.string().trim().min(8).optional(),
    displayPhoneNumber: z.string().trim().min(3).max(60).optional(),
  }),
]);

app.get(
  "/v1/widget/config/:siteKey",
  asyncHandler(async (req, res) => {
    const project = await getProjectBySiteKey(getRouteParam(req, "siteKey"));
    if (!project || project.status !== "active") {
      res.status(404).json({ code: "NOT_FOUND", message: "Project not found" });
      return;
    }

    res.json({
      projectKey: project.projectKey,
      siteKey: project.siteKey,
      botName: project.botName,
      welcomeMessage: project.welcomeMessage,
      starterQuestions: project.starterQuestions,
      assistantProfile: project.assistantProfile,
      runtimePolicy: project.runtimePolicy,
      theme: project.widgetTheme,
      cta: project.ctaConfig,
      promptPolicy: {
        tone: project.promptPolicy.tone,
        outOfScopeMessage: project.promptPolicy.outOfScopeMessage,
      },
      enableHandover: project.enableHandover,
    });
  })
);
prependLatestRouteLayer();

app.post(
  "/v1/widget/sessions",
  asyncHandler(async (req, res) => {
    const parsed = WidgetSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ code: "INVALID_INPUT", issues: parsed.error.flatten() });
      return;
    }

    const project = await getProjectBySiteKey(parsed.data.siteKey);
    if (!project || project.status !== "active" || !isOriginAllowed(project, parsed.data.origin)) {
      res.status(403).json({ code: "FORBIDDEN", message: "Origin not allowed" });
      return;
    }

    const created = await pool.query<{ id: string }>(
      `INSERT INTO conversations (project_id, site_key, origin, user_agent, detected_language)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        project.id,
        project.siteKey,
        parsed.data.origin ?? null,
        req.headers["user-agent"] ?? null,
        parsed.data.detectedLanguage ?? null,
      ]
    );

    await logAnalytics(project.id, created.rows[0].id, "widget_opened", {
      origin: parsed.data.origin ?? null,
    });

    res.status(201).json({
      conversationId: created.rows[0].id,
      botName: project.botName,
      welcomeMessage: project.welcomeMessage,
      assistantProfile: project.assistantProfile,
      runtimePolicy: project.runtimePolicy,
    });
  })
);
prependLatestRouteLayer();

app.post(
  "/v1/widget/messages",
  asyncHandler(async (req, res) => {
    const parsed = WidgetMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ code: "INVALID_INPUT", issues: parsed.error.flatten() });
      return;
    }

    const conversation = await pool.query<DbRow>(
      `SELECT c.id, c.project_id, c.detected_language, p.*
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

    const project = normalizeProjectRow(conversation.rows[0]);
    if (project.status !== "active") {
      res.status(403).json({ code: "FORBIDDEN", message: "Project disabled" });
      return;
    }

    await pool.query(
      `INSERT INTO messages (conversation_id, project_id, role, body)
       VALUES ($1, $2, 'user', $3)`,
      [parsed.data.conversationId, project.id, parsed.data.message]
    );
    await logAnalytics(project.id, parsed.data.conversationId, "message_sent", { message: parsed.data.message });

    const conversationLanguage = project.languageMode === "auto"
      ? String(conversation.rows[0].detected_language ?? project.language)
      : project.language;
    const chunks = await retrieveChunks(project.id, parsed.data.message);
    const answer = await buildWidgetAnswer(project, parsed.data.message, chunks, conversationLanguage);

    await pool.query(
      `INSERT INTO messages (conversation_id, project_id, role, body, citations, confidence)
       VALUES ($1, $2, 'assistant', $3, $4::jsonb, $5)`,
      [
        parsed.data.conversationId,
        project.id,
        answer.message,
        JSON.stringify(answer.citations),
        answer.confidence,
      ]
    );
    await logAnalytics(project.id, parsed.data.conversationId, answer.usedFallback ? "fallback" : "response_served", {
      confidence: answer.confidence,
      citations: answer.citations.map((item) => item.url),
      suggestions: answer.suggestions?.items.map((item) => item.kind) ?? [],
    });
    if (answer.usedFallback) {
      await logAnalytics(project.id, parsed.data.conversationId, "no_answer", { message: parsed.data.message });
    }

    res.setHeader("content-type", "text/event-stream; charset=utf-8");
    res.setHeader("cache-control", "no-cache, no-transform");
    res.setHeader("connection", "keep-alive");
    res.write(`data: ${JSON.stringify({ type: "answer", payload: answer })}\n\n`);
    res.end();
  })
);
prependLatestRouteLayer();

app.get(
  "/v1/portal/tenants/:tenantId/projects/:projectKey",
  requireTenantRead,
  asyncHandler(async (req, res) => {
    const project = await getProjectForTenant(getRouteParam(req, "tenantId"), getRouteParam(req, "projectKey"));
    if (!project) {
      res.status(404).json({ code: "NOT_FOUND", message: "Project not found" });
      return;
    }

    res.json(project);
  })
);
prependLatestRouteLayer();

app.get(
  "/v1/portal/tenants/:tenantId/projects/:projectKey/snippet",
  requireTenantRead,
  asyncHandler(async (req, res) => {
    const project = await getProjectForTenant(getRouteParam(req, "tenantId"), getRouteParam(req, "projectKey"));
    if (!project) {
      res.status(404).json({ code: "NOT_FOUND", message: "Project not found" });
      return;
    }

    res.json(await buildProjectSnippetResponse(project));
  })
);
prependLatestRouteLayer();

app.put(
  "/v1/portal/tenants/:tenantId/projects/:projectKey",
  requireTenantWrite,
  asyncHandler(async (req, res) => {
    const parsed = ProjectUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ code: "INVALID_INPUT", issues: parsed.error.flatten() });
      return;
    }

    const tenantId = getRouteParam(req, "tenantId");
    const projectKey = getRouteParam(req, "projectKey");
    const currentRow = await getProjectRowForTenant(tenantId, projectKey);
    if (!currentRow) {
      res.status(404).json({ code: "NOT_FOUND", message: "Project not found" });
      return;
    }

    const current = normalizeProjectRow(currentRow);
    const nextPromptPolicy: PromptPolicy = {
      ...current.promptPolicy,
      ...(parsed.data.promptPolicy ?? {}),
      guardrails: parsed.data.promptPolicy?.guardrails ?? current.promptPolicy.guardrails,
    };
    const nextCtaConfig: CTAConfig = {
      ...current.ctaConfig,
      ...(parsed.data.ctaConfig ?? {}),
      salesKeywords: parsed.data.ctaConfig?.salesKeywords ?? current.ctaConfig.salesKeywords,
    };
    const nextWidgetTheme: WidgetTheme = compactObject({
      ...current.widgetTheme,
      ...(parsed.data.widgetTheme ?? {}),
      logoUrl: normalizeOptionalString(parsed.data.widgetTheme?.logoUrl, current.widgetTheme.logoUrl),
      launcherEyebrow: normalizeOptionalString(parsed.data.widgetTheme?.launcherEyebrow, current.widgetTheme.launcherEyebrow),
      launcherIcon: normalizeOptionalString(parsed.data.widgetTheme?.launcherIcon, current.widgetTheme.launcherIcon),
      proactiveMessage: normalizeOptionalString(parsed.data.widgetTheme?.proactiveMessage, current.widgetTheme.proactiveMessage),
      botCopy: normalizeOptionalString(parsed.data.widgetTheme?.botCopy, current.widgetTheme.botCopy ?? deriveBotCopy(current)),
      composerPlaceholder: normalizeOptionalString(
        parsed.data.widgetTheme?.composerPlaceholder,
        current.widgetTheme.composerPlaceholder ?? defaultWidgetTheme.composerPlaceholder
      ),
      sendButtonLabel: normalizeOptionalString(
        parsed.data.widgetTheme?.sendButtonLabel,
        current.widgetTheme.sendButtonLabel ?? defaultWidgetTheme.sendButtonLabel
      ),
    });
    const nextAiConfig: AiConfig = compactObject({
      ...current.aiConfig,
      ...(parsed.data.aiConfig ?? {}),
    });
    const nextMetadata = deepMergeRecord(
      current.metadata,
      parsed.data.metadata ?? {},
    );
    const starterQuestions = sanitizeStarterQuestions(parsed.data.starterQuestions) ?? current.starterQuestions;
    nextMetadata["widgetRuntime"] = deepMergeRecord(
      asRecord(nextMetadata["widgetRuntime"]),
      { starterQuestions }
    );

    const update = await pool.query<DbRow>(
      `UPDATE projects
       SET name = $1,
           status = $2,
           language = $3,
           allowed_domains = $4,
           bot_name = $5,
           welcome_message = $6,
           prompt_policy = $7::jsonb,
           cta_config = $8::jsonb,
           widget_theme = $9::jsonb,
           public_base_url = $10,
           metadata = $11::jsonb,
           enable_handover = $12,
           ai_config = $13::jsonb,
           language_mode = $14,
           updated_at = NOW()
       WHERE tenant_id = $15
         AND project_key = $16
       RETURNING *`,
      [
        parsed.data.name ?? current.name,
        parsed.data.status ?? current.status,
        parsed.data.language ?? current.language,
        parsed.data.allowedDomains ?? current.allowedDomains,
        parsed.data.botName ?? current.botName,
        parsed.data.welcomeMessage ?? current.welcomeMessage,
        JSON.stringify(nextPromptPolicy),
        JSON.stringify(nextCtaConfig),
        JSON.stringify(nextWidgetTheme),
        parsed.data.publicBaseUrl === undefined ? current.publicBaseUrl : parsed.data.publicBaseUrl,
        JSON.stringify(nextMetadata),
        parsed.data.enableHandover ?? current.enableHandover,
        JSON.stringify(nextAiConfig),
        parsed.data.languageMode ?? current.languageMode,
        tenantId,
        projectKey,
      ]
    );

    res.json(normalizeProjectRow(update.rows[0]));
  })
);
prependLatestRouteLayer();

app.post(
  "/v1/portal/tenants/:tenantId/projects/:projectKey/website-integration",
  requireTenantWrite,
  asyncHandler(async (req, res) => {
    const parsed = WebsiteIntegrationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ code: "INVALID_INPUT", issues: parsed.error.flatten() });
      return;
    }

    const project = await getProjectForTenant(getRouteParam(req, "tenantId"), getRouteParam(req, "projectKey"));
    if (!project) {
      res.status(404).json({ code: "NOT_FOUND", message: "Project not found" });
      return;
    }

    try {
      normalizeWebsiteBaseUrl(parsed.data.baseUrl);
    } catch (error: any) {
      res.status(400).json({ code: "INVALID_INPUT", message: error?.message ?? "Invalid website URL" });
      return;
    }

    const actor = (req as PortalRequest).portalUser?.email ?? "portal";
    res.json(await provisionWebsiteIntegration(project, parsed.data.baseUrl, actor));
  })
);
prependLatestRouteLayer();

app.post(
  "/v1/portal/tenants/:tenantId/projects/:projectKey/crawl",
  requireTenantRead,
  asyncHandler(async (req, res) => {
    const parsed = CrawlSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ code: "INVALID_INPUT", issues: parsed.error.flatten() });
      return;
    }

    const result = await crawlUseCase.execute({ url: parsed.data.url });
    res.json(result);
  })
);

app.get(
  "/v1/portal/tenants/:tenantId/conversations",
  requireTenantRead,
  asyncHandler(async (req, res) => {
    const tenantId = getRouteParam(req, "tenantId");
    const projectKey = typeof req.query["projectKey"] === "string" ? req.query["projectKey"].trim() : "";
    const limit = Math.min(100, Math.max(1, Number(req.query["limit"] ?? 100)));
    const params: unknown[] = [tenantId];
    let projectFilter = "";
    if (projectKey) {
      params.push(projectKey);
      projectFilter = `AND p.project_key = $${params.length}`;
    }
    params.push(limit);

    const result = await pool.query<DbRow>(
      `SELECT
         c.id,
         c.project_id AS "projectId",
         c.origin,
         c.user_agent AS "userAgent",
         c.created_at AS "createdAt",
         COALESCE(stats.message_count, 0)::int AS "messageCount",
         stats.last_message_at AS "lastMessageAt",
         p.project_key AS "projectKey",
         last_msg.body AS "lastMessagePreview",
         last_msg.role AS "lastMessageRole"
       FROM conversations c
       INNER JOIN projects p ON p.id = c.project_id
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::int AS message_count, MAX(created_at) AS last_message_at
         FROM messages
         WHERE conversation_id = c.id
       ) stats ON TRUE
       LEFT JOIN LATERAL (
         SELECT body, role
         FROM messages
         WHERE conversation_id = c.id
         ORDER BY created_at DESC
         LIMIT 1
       ) last_msg ON TRUE
       WHERE p.tenant_id = $1
         ${projectFilter}
       ORDER BY COALESCE(stats.last_message_at, c.created_at) DESC
       LIMIT $${params.length}`,
      params
    );

    res.json(result.rows.map((row) => ({
      ...row,
      ...detectConversationChannel(row.origin),
    })));
  })
);
prependLatestRouteLayer();

app.get(
  "/v1/portal/tenants/:tenantId/analytics/summary",
  requireTenantRead,
  asyncHandler(async (req, res) => {
    const tenantId = getRouteParam(req, "tenantId");
    const projectKey = typeof req.query["projectKey"] === "string" ? req.query["projectKey"].trim() : "";
    if (!projectKey) {
      res.status(400).json({ code: "INVALID_QUERY", message: "projectKey is required" });
      return;
    }

    const project = await getProjectForTenant(tenantId, projectKey);
    if (!project) {
      res.status(404).json({ code: "NOT_FOUND", message: "Project not found" });
      return;
    }

    const [events, unanswered, leads] = await Promise.all([
      pool.query<{ eventType: string; total: number }>(
        `SELECT event_type AS "eventType", COUNT(*)::int AS total
         FROM analytics_events
         WHERE project_id = $1
         GROUP BY event_type
         ORDER BY total DESC`,
        [project.id]
      ),
      pool.query<{ message: string; total: number }>(
        `SELECT payload->>'message' AS message, COUNT(*)::int AS total
         FROM analytics_events
         WHERE project_id = $1
           AND event_type = 'no_answer'
           AND payload ? 'message'
         GROUP BY payload->>'message'
         ORDER BY total DESC
         LIMIT 10`,
        [project.id]
      ),
      pool.query<{ deliveryStatus: string; total: number }>(
        `SELECT delivery_status AS "deliveryStatus", COUNT(*)::int AS total
         FROM lead_events
         WHERE project_id = $1
         GROUP BY delivery_status
         ORDER BY total DESC`,
        [project.id]
      ),
    ]);

    res.json({
      projectKey: project.projectKey,
      events: events.rows,
      unanswered: unanswered.rows,
      leads: leads.rows,
    });
  })
);
prependLatestRouteLayer();

app.get(
  "/v1/portal/tenants/:tenantId/analytics/satisfaction",
  requireTenantRead,
  asyncHandler(async (req, res) => {
    const tenantId = getRouteParam(req, "tenantId");
    const projectKey = typeof req.query["projectKey"] === "string" ? req.query["projectKey"].trim() : "";
    if (projectKey) {
      const project = await getProjectForTenant(tenantId, projectKey);
      if (!project) {
        res.status(404).json({ code: "NOT_FOUND", message: "Project not found" });
        return;
      }
    }

    const params: unknown[] = [tenantId];
    const projectFilter = projectKey
      ? `AND p.project_key = $${params.push(projectKey)}`
      : "";

    const aggregate = await pool.query<{
      avg: string | null;
      total: string;
      distribution: Record<string, number> | null;
    }>(
      `WITH scoped AS (
         SELECT cr.score
         FROM conversation_ratings cr
         INNER JOIN projects p ON p.id = cr.project_id
         WHERE p.tenant_id = $1
           ${projectFilter}
       ),
       distribution AS (
         SELECT jsonb_object_agg(score_key, score_total) AS data
         FROM (
           SELECT bucket.score_key, COALESCE(scoped_totals.score_total, 0) AS score_total
           FROM generate_series(1, 5) AS bucket(score_key)
           LEFT JOIN (
             SELECT score, COUNT(*)::int AS score_total
             FROM scoped
             GROUP BY score
           ) scoped_totals ON scoped_totals.score = bucket.score_key
         ) scores
       )
       SELECT
         ROUND(AVG(score)::numeric, 2)::text AS avg,
         COUNT(*)::text AS total,
         distribution.data AS distribution
       FROM scoped, distribution`,
      params
    );

    const comments = await pool.query<{ score: number; comment: string | null; date: string }>(
      `SELECT
         cr.score,
         cr.comment,
         cr.created_at::text AS date
       FROM conversation_ratings cr
       INNER JOIN projects p ON p.id = cr.project_id
       WHERE p.tenant_id = $1
         ${projectFilter}
         AND cr.comment IS NOT NULL
       ORDER BY cr.created_at DESC
       LIMIT 10`,
      params
    );

    res.json({
      avg: Number(aggregate.rows[0]?.avg ?? 0),
      total: Number(aggregate.rows[0]?.total ?? 0),
      distribution: aggregate.rows[0]?.distribution ?? {},
      recentComments: comments.rows,
    });
  })
);
prependLatestRouteLayer();

app.get(
  "/v1/portal/tenants/:tenantId/analytics/rag-quality",
  requireTenantRead,
  asyncHandler(async (req, res) => {
    const tenantId = getRouteParam(req, "tenantId");
    const projectKey = typeof req.query["projectKey"] === "string" ? req.query["projectKey"].trim() : "";
    const period = readAnalyticsPeriod(req.query["period"]);
    if (projectKey) {
      const project = await getProjectForTenant(tenantId, projectKey);
      if (!project) {
        res.status(404).json({ code: "NOT_FOUND", message: "Project not found" });
        return;
      }
    }

    const params: unknown[] = [tenantId, period.days];
    const projectFilter = projectKey
      ? `AND p.project_key = $${params.push(projectKey)}`
      : "";

    const aggregate = await pool.query<{
      totalMessages: string;
      fallbackCount: string;
      avgConfidence: string | null;
      lowConfidenceCount: string;
    }>(
      `SELECT
         COUNT(*) FILTER (WHERE ae.event_type = 'message_sent')::text AS "totalMessages",
         COUNT(*) FILTER (WHERE ae.event_type = 'fallback')::text AS "fallbackCount",
         ROUND(AVG((ae.payload->>'confidence')::numeric) FILTER (WHERE ae.payload ? 'confidence'), 4)::text AS "avgConfidence",
         COUNT(*) FILTER (
           WHERE ae.payload ? 'confidence'
             AND (ae.payload->>'confidence')::numeric < 0.3
         )::text AS "lowConfidenceCount"
       FROM analytics_events ae
       INNER JOIN projects p ON p.id = ae.project_id
       WHERE p.tenant_id = $1
         AND ae.created_at >= NOW() - ($2 || ' days')::interval
         ${projectFilter}`,
      params
    );

    const gaps = await pool.query<{ question: string; count: number }>(
      `SELECT
         payload->>'message' AS question,
         COUNT(*)::int AS count
       FROM analytics_events ae
       INNER JOIN projects p ON p.id = ae.project_id
       WHERE p.tenant_id = $1
         AND ae.created_at >= NOW() - ($2 || ' days')::interval
         AND ae.event_type = 'no_answer'
         AND ae.payload ? 'message'
         ${projectFilter}
       GROUP BY payload->>'message'
       ORDER BY count DESC, question ASC
       LIMIT 10`,
      params
    );

    const totalMessages = Number(aggregate.rows[0]?.totalMessages ?? 0);
    const fallbackCount = Number(aggregate.rows[0]?.fallbackCount ?? 0);

    res.json({
      period: period.label,
      totalMessages,
      fallbackRate: totalMessages > 0 ? Number(((fallbackCount / totalMessages) * 100).toFixed(1)) : 0,
      avgConfidence: aggregate.rows[0]?.avgConfidence == null ? null : Number(aggregate.rows[0].avgConfidence),
      lowConfidenceCount: Number(aggregate.rows[0]?.lowConfidenceCount ?? 0),
      coverageScore: totalMessages > 0
        ? Math.round(((totalMessages - fallbackCount) / totalMessages) * 100)
        : null,
      topGaps: gaps.rows,
    });
  })
);
prependLatestRouteLayer();

app.get(
  "/v1/portal/tenants/:tenantId/analytics/trends",
  requireTenantRead,
  asyncHandler(async (req, res) => {
    const tenantId = getRouteParam(req, "tenantId");
    const projectKey = typeof req.query["projectKey"] === "string" ? req.query["projectKey"].trim() : "";
    const period = readAnalyticsPeriod(req.query["period"]);
    if (projectKey) {
      const project = await getProjectForTenant(tenantId, projectKey);
      if (!project) {
        res.status(404).json({ code: "NOT_FOUND", message: "Project not found" });
        return;
      }
    }

    const params: unknown[] = [tenantId, period.days];
    const projectFilter = projectKey
      ? `AND p.project_key = $${params.push(projectKey)}`
      : "";

    const rates = await pool.query<{
      totalConversations: string;
      resolvedConversations: string;
      handoverConversations: string;
      avgMessagesPerConversation: string | null;
      avgConversationDurationMinutes: string | null;
    }>(
      `WITH scoped_conversations AS (
         SELECT c.id, c.created_at
         FROM conversations c
         INNER JOIN projects p ON p.id = c.project_id
         WHERE p.tenant_id = $1
           AND c.created_at >= NOW() - ($2 || ' days')::interval
           ${projectFilter}
       ),
       conversation_metrics AS (
         SELECT
           scoped_conversations.id,
           scoped_conversations.created_at,
           EXISTS (
             SELECT 1
             FROM analytics_events ae
             WHERE ae.conversation_id = scoped_conversations.id
               AND ae.event_type = 'response_served'
           ) AS resolved,
           EXISTS (
             SELECT 1
             FROM handover_events he
             WHERE he.conversation_id = scoped_conversations.id
           ) AS handed_over,
           (
             SELECT COUNT(*)::int
             FROM messages m
             WHERE m.conversation_id = scoped_conversations.id
           ) AS message_count,
           (
             SELECT MAX(m.created_at)
             FROM messages m
             WHERE m.conversation_id = scoped_conversations.id
           ) AS last_message_at
         FROM scoped_conversations
       )
       SELECT
         COUNT(*)::text AS "totalConversations",
         COUNT(*) FILTER (WHERE resolved)::text AS "resolvedConversations",
         COUNT(*) FILTER (WHERE handed_over)::text AS "handoverConversations",
         ROUND(AVG(message_count)::numeric, 2)::text AS "avgMessagesPerConversation",
         ROUND(AVG(EXTRACT(EPOCH FROM (COALESCE(last_message_at, created_at) - created_at)) / 60)::numeric, 2)::text AS "avgConversationDurationMinutes"
       FROM conversation_metrics`,
      params
    );

    const daily = await pool.query<{ date: string; messages: number; resolved: number; handovers: number }>(
      `WITH message_days AS (
         SELECT
           DATE(ae.created_at)::text AS date,
           COUNT(*) FILTER (WHERE ae.event_type = 'message_sent')::int AS messages,
           COUNT(*) FILTER (WHERE ae.event_type = 'response_served')::int AS resolved
         FROM analytics_events ae
         INNER JOIN projects p ON p.id = ae.project_id
         WHERE p.tenant_id = $1
           AND ae.created_at >= NOW() - ($2 || ' days')::interval
           ${projectFilter}
         GROUP BY DATE(ae.created_at)
       ),
       handover_days AS (
         SELECT
           DATE(he.created_at)::text AS date,
           COUNT(*)::int AS handovers
         FROM handover_events he
         INNER JOIN projects p ON p.id = he.project_id
         WHERE p.tenant_id = $1
           AND he.created_at >= NOW() - ($2 || ' days')::interval
           ${projectFilter}
         GROUP BY DATE(he.created_at)
       )
       SELECT
         COALESCE(message_days.date, handover_days.date) AS date,
         COALESCE(message_days.messages, 0)::int AS messages,
         COALESCE(message_days.resolved, 0)::int AS resolved,
         COALESCE(handover_days.handovers, 0)::int AS handovers
       FROM message_days
       FULL OUTER JOIN handover_days ON handover_days.date = message_days.date
       ORDER BY date ASC`,
      params
    );

    const totalConversations = Number(rates.rows[0]?.totalConversations ?? 0);
    const resolvedConversations = Number(rates.rows[0]?.resolvedConversations ?? 0);
    const handoverConversations = Number(rates.rows[0]?.handoverConversations ?? 0);

    res.json({
      period: period.label,
      resolutionRate: totalConversations > 0
        ? Math.round((resolvedConversations / totalConversations) * 100)
        : null,
      handoverRate: totalConversations > 0
        ? Math.round((handoverConversations / totalConversations) * 100)
        : null,
      avgMessagesPerConversation: rates.rows[0]?.avgMessagesPerConversation == null
        ? null
        : Number(rates.rows[0].avgMessagesPerConversation),
      avgConversationDurationMinutes: rates.rows[0]?.avgConversationDurationMinutes == null
        ? null
        : Number(rates.rows[0].avgConversationDurationMinutes),
      dailySeries: daily.rows,
    });
  })
);
prependLatestRouteLayer();

app.post(
  "/v1/portal/tenants/:tenantId/assets/logo",
  requireTenantWrite,
  uploadParser,
  asyncHandler(async (req, res) => {
    const filename = readUploadFilename(req);
    const mimeType = readUploadMimeType(req);
    const payload = readUploadBuffer(req);
    if (!payload.length) {
      res.status(400).json({ code: "INVALID_UPLOAD", message: "Logo file is required" });
      return;
    }
    if (!isSupportedLogoMimeType(mimeType, filename)) {
      res.status(400).json({ code: "INVALID_UPLOAD", message: "Only SVG, PNG, JPG and WebP logos are supported" });
      return;
    }

    const asset = await persistUploadedAsset(
      ["logos", getRouteParam(req, "tenantId")],
      filename,
      mimeType,
      payload
    );
    res.status(201).json(asset);
  })
);
prependLatestRouteLayer();

app.post(
  "/v1/portal/tenants/:tenantId/projects/:projectKey/assets/document",
  requireTenantWrite,
  uploadParser,
  asyncHandler(async (req, res) => {
    const tenantId = getRouteParam(req, "tenantId");
    const projectKey = getRouteParam(req, "projectKey");
    const projectRow = await getProjectRowForTenant(tenantId, projectKey);
    if (!projectRow) {
      res.status(404).json({ code: "NOT_FOUND", message: "Project not found" });
      return;
    }

    const filename = readUploadFilename(req);
    const mimeType = readUploadMimeType(req);
    const payload = readUploadBuffer(req);
    if (!payload.length) {
      res.status(400).json({ code: "INVALID_UPLOAD", message: "Document file is required" });
      return;
    }

    const detectedKind = detectDocumentKind(filename, mimeType);
    if (!detectedKind) {
      res.status(400).json({ code: "INVALID_UPLOAD", message: "Only PDF, Markdown, TXT and HTML documents are supported" });
      return;
    }

    const asset = await persistUploadedAsset(
      ["documents", tenantId, projectKey],
      filename,
      mimeType,
      payload
    );
    const sourceKey = normalizeSourceKey(
      readSourceKeyHeader(req) ?? filename,
      detectedKind
    );

    const sourceResult = await pool.query<DbRow>(
      `INSERT INTO sources (
         project_id,
         source_key,
         kind,
         entry_url,
         include_patterns,
         exclude_patterns,
         allowed_domains,
         visibility,
         default_category,
         source_config
       )
       VALUES ($1, $2, $3, $4, '{}', '{}', '{}', 'private', $5, $6::jsonb)
       ON CONFLICT (project_id, source_key)
       DO UPDATE SET
         kind = EXCLUDED.kind,
         entry_url = EXCLUDED.entry_url,
         source_config = EXCLUDED.source_config,
         updated_at = NOW()
       RETURNING *`,
      [
        String(projectRow.id),
        sourceKey,
        detectedKind,
        asset.url,
        detectedKind,
        JSON.stringify({
          upload: {
            filename: asset.filename,
            mimeType: asset.mimeType,
            size: asset.size,
            uploadedAt: new Date().toISOString(),
          },
        }),
      ]
    );

    const requestedBy = (req as PortalRequest).portalUser?.email ?? "system";
    const jobResult = await pool.query<DbRow>(
      `INSERT INTO ingestion_jobs (project_id, source_id, status, requested_by, summary)
       VALUES ($1, $2, 'queued', $3, '{}'::jsonb)
       RETURNING id`,
      [String(projectRow.id), String(sourceResult.rows[0].id), requestedBy]
    );

    res.status(201).json({
      ...asset,
      sourceKey,
      jobId: String(jobResult.rows[0].id),
    } satisfies UploadedAsset);
  })
);
prependLatestRouteLayer();

app.get(
  "/v1/portal/tenants/:tenantId/projects/:projectKey/channels",
  requireTenantRead,
  asyncHandler(async (req, res) => {
    const project = await getProjectForTenant(getRouteParam(req, "tenantId"), getRouteParam(req, "projectKey"));
    if (!project) {
      res.status(404).json({ code: "NOT_FOUND", message: "Project not found" });
      return;
    }

    const result = await pool.query<DbRow>(
      `SELECT ch.*
       FROM channels ch
       WHERE ch.project_id = $1
       ORDER BY ch.created_at DESC`,
      [project.id]
    );

    res.json(result.rows.map((row) => toChannelResponse(row, project.projectKey)));
  })
);
prependLatestRouteLayer();

app.post(
  "/v1/portal/tenants/:tenantId/projects/:projectKey/channels",
  requireTenantWrite,
  asyncHandler(async (req, res) => {
    const project = await getProjectForTenant(getRouteParam(req, "tenantId"), getRouteParam(req, "projectKey"));
    if (!project) {
      res.status(404).json({ code: "NOT_FOUND", message: "Project not found" });
      return;
    }

    const parsed = channelCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ code: "INVALID_INPUT", issues: parsed.error.flatten() });
      return;
    }

    const channelId = randomUUID();
    if (parsed.data.kind === "telegram") {
      const webhookSecret = process.env["TELEGRAM_WEBHOOK_SECRET"] ?? "talkaris-tg-secret";
      const webhookUrl = `${publicApiBase}/v1/telegram/webhook/${channelId}`;
      const response = await fetch(`https://api.telegram.org/bot${parsed.data.botToken}/setWebhook`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url: webhookUrl,
          secret_token: webhookSecret,
        }),
      });
      if (!response.ok) {
        const body = await response.text();
        res.status(502).json({ code: "TELEGRAM_WEBHOOK_FAILED", message: body || "Telegram webhook registration failed" });
        return;
      }

      const config = {
        botToken: parsed.data.botToken,
        webhookSecret,
        label: parsed.data.label?.trim() || project.botName,
        webhookUrl,
        verifiedAt: new Date().toISOString(),
      };
      const insert = await pool.query<DbRow>(
        `INSERT INTO channels (id, project_id, kind, config, status)
         VALUES ($1, $2, 'telegram', $3::jsonb, 'active')
         RETURNING *`,
        [channelId, project.id, JSON.stringify(config)]
      );
      res.status(201).json(toChannelResponse(insert.rows[0], project.projectKey));
      return;
    }

    const whatsappWebhookUrl = `${publicApiBase}/v1/whatsapp/webhook/${channelId}`;
    const insert = await pool.query<DbRow>(
      `INSERT INTO channels (id, project_id, kind, config, status)
       VALUES ($1, $2, 'whatsapp', $3::jsonb, 'active')
       RETURNING *`,
      [
        channelId,
        project.id,
        JSON.stringify({
          label: parsed.data.label?.trim() || project.botName,
          accessToken: parsed.data.accessToken,
          phoneNumberId: parsed.data.phoneNumberId,
          businessAccountId: parsed.data.businessAccountId,
          verifyToken: parsed.data.verifyToken,
          appSecret: parsed.data.appSecret,
          displayPhoneNumber: parsed.data.displayPhoneNumber,
          webhookUrl: whatsappWebhookUrl,
        }),
      ]
    );
    res.status(201).json(toChannelResponse(insert.rows[0], project.projectKey));
  })
);
prependLatestRouteLayer();

app.delete(
  "/v1/portal/tenants/:tenantId/projects/:projectKey/channels/:channelId",
  requireTenantWrite,
  asyncHandler(async (req, res) => {
    const project = await getProjectForTenant(getRouteParam(req, "tenantId"), getRouteParam(req, "projectKey"));
    if (!project) {
      res.status(404).json({ code: "NOT_FOUND", message: "Project not found" });
      return;
    }

    const result = await pool.query<DbRow>(
      `SELECT ch.*
       FROM channels ch
       WHERE ch.id = $1
         AND ch.project_id = $2
       LIMIT 1`,
      [getRouteParam(req, "channelId"), project.id]
    );
    if (!result.rowCount) {
      res.status(404).json({ code: "NOT_FOUND", message: "Channel not found" });
      return;
    }

    const config = asRecord(result.rows[0].config);
    if (result.rows[0].kind === "telegram" && typeof config["botToken"] === "string") {
      await fetch(`https://api.telegram.org/bot${config["botToken"]}/deleteWebhook`).catch(() => undefined);
    }

    await pool.query(`DELETE FROM channels WHERE id = $1`, [getRouteParam(req, "channelId")]);
    res.json({ ok: true });
  })
);
prependLatestRouteLayer();

app.post(
  "/v1/telegram/webhook/:channelId",
  asyncHandler(async (req, res) => {
    const expectedSecret = process.env["TELEGRAM_WEBHOOK_SECRET"] ?? "talkaris-tg-secret";
    const secret = req.headers["x-telegram-bot-api-secret-token"];
    if (secret !== expectedSecret) {
      res.status(401).end();
      return;
    }

    const update = req.body as Record<string, any>;
    const text = String(update?.message?.text ?? "").trim();
    const chatId = String(update?.message?.chat?.id ?? "");
    if (!text || !chatId) {
      res.json({ ok: true });
      return;
    }

    const channel = await loadChannelWithProject(getRouteParam(req, "channelId"), "telegram");
    if (!channel) {
      res.json({ ok: true });
      return;
    }

    const replyText = await buildChannelReply({
      channelId: channel.id,
      kind: "telegram",
      project: channel.project,
      externalThreadId: chatId,
      message: text,
      detectedLanguage: String(update?.message?.from?.language_code ?? channel.project.language).slice(0, 2) || channel.project.language,
    });

    const config = asRecord(channel.config);
    await fetch(`https://api.telegram.org/bot${String(config["botToken"])}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: replyText,
      }),
    }).catch(() => undefined);

    res.json({ ok: true });
  })
);
prependLatestRouteLayer();

app.get(
  "/v1/whatsapp/webhook/:channelId",
  asyncHandler(async (req, res) => {
    const channelId = getRouteParam(req, "channelId");
    const result = await pool.query<DbRow>(
      `SELECT ch.*
       FROM channels ch
       WHERE ch.id = $1
         AND ch.kind = 'whatsapp'
       LIMIT 1`,
      [channelId]
    );
    if (!result.rowCount) {
      res.status(404).end();
      return;
    }

    const config = asRecord(result.rows[0].config);
    const mode = String(req.query["hub.mode"] ?? "");
    const token = String(req.query["hub.verify_token"] ?? "");
    const challenge = String(req.query["hub.challenge"] ?? "");
    if (mode !== "subscribe" || token !== String(config["verifyToken"] ?? "")) {
      res.status(403).end();
      return;
    }

    await markWhatsappChannelVerified(channelId);
    res.status(200).send(challenge);
  })
);
prependLatestRouteLayer();

app.post(
  "/v1/whatsapp/webhook/:channelId",
  asyncHandler(async (req, res) => {
    const channel = await loadChannelWithProject(getRouteParam(req, "channelId"), "whatsapp");
    if (!channel) {
      res.json({ ok: true });
      return;
    }

    const body = req.body as Record<string, any>;
    const entries = Array.isArray(body?.["entry"]) ? body["entry"] : [];
    const config = asRecord(channel.config);
    for (const entry of entries) {
      const changes = Array.isArray(entry?.changes) ? entry.changes : [];
      for (const change of changes) {
        const value = asRecord(change?.value);
        const messages = Array.isArray(value["messages"]) ? value["messages"] as Array<Record<string, any>> : [];
        for (const message of messages) {
          const text = String(asRecord(message["text"])["body"] ?? "").trim();
          const from = String(message["from"] ?? "").trim();
          const phoneNumberId = String(value["metadata"]?.phone_number_id ?? config["phoneNumberId"] ?? "");
          if (!text || !from || !phoneNumberId) {
            continue;
          }

          const replyText = await buildChannelReply({
            channelId: channel.id,
            kind: "whatsapp",
            project: channel.project,
            externalThreadId: from,
            message: text,
            detectedLanguage: channel.project.language,
          });

          await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
            method: "POST",
            headers: {
              authorization: `Bearer ${String(config["accessToken"] ?? "")}`,
              "content-type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: from,
              type: "text",
              text: { body: replyText },
            }),
          }).catch(() => undefined);
        }
      }
    }

    await markWhatsappChannelVerified(channel.id);
    res.json({ ok: true });
  })
);
prependLatestRouteLayer();

function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler {
  return (req, res, next) => {
    void handler(req, res, next).catch(next);
  };
}

function requireTenantRead(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    const portalUser = await authenticateCookieUser(req as PortalRequest, res);
    if (!portalUser) {
      return;
    }

    if (portalUser.platformRole === "superadmin") {
      (req as PortalRequest).portalUser = portalUser;
      next();
      return;
    }

    const tenantId = req.params["tenantId"];
    const membership = portalUser.memberships.find((item) => item.tenantId === tenantId);
    if (!membership) {
      res.status(403).json({ code: "FORBIDDEN", message: "Tenant access denied" });
      return;
    }

    (req as PortalRequest).portalUser = portalUser;
    next();
  })().catch(next);
}

function requireTenantWrite(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    const portalUser = await authenticateCookieUser(req as PortalRequest, res);
    if (!portalUser) {
      return;
    }

    if (portalUser.platformRole === "superadmin") {
      (req as PortalRequest).portalUser = portalUser;
      next();
      return;
    }

    const tenantId = req.params["tenantId"];
    const membership = portalUser.memberships.find((item) => item.tenantId === tenantId);
    if (!membership || membership.role === "viewer") {
      res.status(403).json({ code: "FORBIDDEN", message: "Tenant write access denied" });
      return;
    }

    (req as PortalRequest).portalUser = portalUser;
    next();
  })().catch(next);
}

async function authenticateCookieUser(req: PortalRequest, res: Response): Promise<PortalUser | null> {
  const token = readSessionToken(req);
  if (!token) {
    res.status(401).json({ code: "UNAUTHENTICATED", message: "Missing session" });
    return null;
  }

  try {
    const claims = jwt.verify(token, env.JWT_SECRET) as SessionClaims;
    const user = await loadPortalUserById(claims.sub);
    if (!user || user.status !== "active") {
      res.status(401).json({ code: "UNAUTHENTICATED", message: "Invalid session" });
      return null;
    }
    return user;
  } catch {
    res.status(401).json({ code: "UNAUTHENTICATED", message: "Invalid session" });
    return null;
  }
}

function readSessionToken(req: Request): string | null {
  const fromCookie = req.cookies?.[env.COOKIE_NAME];
  if (typeof fromCookie === "string" && fromCookie.length > 0) {
    return fromCookie;
  }

  const authHeader = req.headers.authorization;
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length);
  }

  return null;
}

async function loadPortalUserById(userId: string): Promise<PortalUser | null> {
  const userResult = await pool.query<{
    id: string;
    email: string;
    platform_role: PlatformRole;
    status: "pending" | "active" | "disabled";
  }>(
    `SELECT id, email, platform_role, status
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId]
  );

  if (!userResult.rowCount) {
    return null;
  }

  const membershipResult = await pool.query<{
    tenant_id: string;
    role: TenantRole;
  }>(
    `SELECT tenant_id, role
     FROM tenant_memberships
     WHERE user_id = $1`,
    [userId]
  );

  return {
    id: userResult.rows[0].id,
    email: userResult.rows[0].email,
    platformRole: userResult.rows[0].platform_role,
    status: userResult.rows[0].status,
    memberships: membershipResult.rows.map((row) => ({
      tenantId: row.tenant_id,
      role: row.role,
    })),
  };
}

function getRouteParam(req: Request, key: string): string {
  return String(req.params[key] ?? "");
}

function prependLatestRouteLayer(): void {
  const stack = (app as any)?._router?.stack;
  if (!Array.isArray(stack) || stack.length < 2) {
    return;
  }

  const latestLayer = stack.pop();
  const firstRouteIndex = stack.findIndex((layer: any) => layer?.route);
  const insertIndex = firstRouteIndex === -1 ? stack.length : firstRouteIndex;
  stack.splice(insertIndex, 0, latestLayer);
}

function detectConversationChannel(origin: unknown): {
  channelKind: "widget" | "telegram" | "whatsapp" | "other";
  contactLabel: string | null;
} {
  if (typeof origin !== "string" || !origin.trim()) {
    return { channelKind: "widget", contactLabel: null };
  }
  if (origin.startsWith("telegram:")) {
    return {
      channelKind: "telegram",
      contactLabel: origin.split(":").at(-1) ?? null,
    };
  }
  if (origin.startsWith("whatsapp:")) {
    return {
      channelKind: "whatsapp",
      contactLabel: origin.split(":").at(-1) ?? null,
    };
  }
  if (origin.startsWith("http://") || origin.startsWith("https://")) {
    return { channelKind: "widget", contactLabel: origin };
  }
  return { channelKind: "other", contactLabel: origin };
}

function readUploadFilename(req: Request): string {
  const header = req.headers["x-upload-filename"];
  const raw = Array.isArray(header) ? header[0] : header;
  if (typeof raw !== "string" || !raw.trim()) {
    return "upload.bin";
  }
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function readUploadMimeType(req: Request): string {
  const header = req.headers["x-upload-mime-type"];
  const raw = Array.isArray(header) ? header[0] : header;
  if (typeof raw === "string" && raw.trim()) {
    return raw.trim().toLowerCase();
  }
  return String(req.headers["content-type"] ?? "application/octet-stream").split(";")[0].trim().toLowerCase();
}

function readSourceKeyHeader(req: Request): string | undefined {
  const header = req.headers["x-source-key"];
  const raw = Array.isArray(header) ? header[0] : header;
  return typeof raw === "string" && raw.trim() ? raw.trim() : undefined;
}

function readUploadBuffer(req: Request): Buffer {
  return Buffer.isBuffer((req as Request & { body?: unknown }).body)
    ? ((req as Request & { body: Buffer }).body)
    : Buffer.alloc(0);
}

function sanitizePathSegment(value: string): string {
  const normalized = value
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return normalized || "asset";
}

function normalizeFilename(filename: string, mimeType: string): { base: string; ext: string } {
  const ext = path.extname(filename).toLowerCase() || extensionFromMimeType(mimeType);
  const base = sanitizePathSegment(path.basename(filename, path.extname(filename) || ext || ""));
  return {
    base,
    ext: ext || ".bin",
  };
}

function extensionFromMimeType(mimeType: string): string {
  switch (mimeType) {
    case "image/svg+xml":
      return ".svg";
    case "image/png":
      return ".png";
    case "image/jpeg":
      return ".jpg";
    case "image/webp":
      return ".webp";
    case "application/pdf":
      return ".pdf";
    case "text/markdown":
    case "text/plain":
      return ".md";
    case "text/html":
      return ".html";
    default:
      return ".bin";
  }
}

function isSupportedLogoMimeType(mimeType: string, filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ["image/svg+xml", "image/png", "image/jpeg", "image/webp"].includes(mimeType)
    || [".svg", ".png", ".jpg", ".jpeg", ".webp"].includes(ext);
}

function detectDocumentKind(filename: string, mimeType: string): "pdf" | "markdown" | "html" | null {
  const ext = path.extname(filename).toLowerCase();
  if (mimeType === "application/pdf" || ext === ".pdf") {
    return "pdf";
  }
  if (mimeType === "text/html" || ext === ".html" || ext === ".htm") {
    return "html";
  }
  if (
    mimeType === "text/markdown"
    || mimeType === "text/plain"
    || [".md", ".markdown", ".txt"].includes(ext)
  ) {
    return "markdown";
  }
  return null;
}

function normalizeSourceKey(value: string, kind: string): string {
  const base = sanitizePathSegment(value.replace(path.extname(value), ""));
  return `${base || kind}-${kind}`;
}

async function persistUploadedAsset(
  folders: string[],
  filename: string,
  mimeType: string,
  payload: Buffer
): Promise<UploadedAsset> {
  const { base, ext } = normalizeFilename(filename, mimeType);
  const fileName = `${Date.now()}-${randomUUID().slice(0, 8)}-${base}${ext}`;
  const relativePath = path.join(...folders.map(sanitizePathSegment), fileName);
  const absolutePath = path.join(assetsRoot, relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, payload);
  return {
    url: `${publicApiBase}/v1/assets/${relativePath.replace(/\\/g, "/")}`,
    filename,
    mimeType,
    size: payload.length,
  };
}

function toChannelResponse(row: DbRow, projectKey: string): Record<string, unknown> {
  const config = asRecord(row.config);
  const kind = row.kind === "whatsapp" ? "whatsapp" : "telegram";
  return {
    id: String(row.id),
    kind,
    status: row.status === "paused" ? "paused" : "active",
    has_token: Boolean(config["botToken"] || config["accessToken"]),
    created_at: row.created_at,
    webhookUrl: normalizeOptionalString(config["webhookUrl"]),
    verified: kind === "telegram" ? true : Boolean(config["verifiedAt"]),
    label: normalizeOptionalString(config["label"]),
    phoneNumber: normalizeOptionalString(config["displayPhoneNumber"]),
    projectKey,
    lastError: normalizeOptionalString(config["lastError"]),
    configSummary: compactObject({
      phoneNumberId: normalizeOptionalString(config["phoneNumberId"]),
      businessAccountId: normalizeOptionalString(config["businessAccountId"]),
      verifiedAt: normalizeOptionalString(config["verifiedAt"]),
    }),
  };
}

async function loadChannelWithProject(
  channelId: string,
  kind: ChannelKind
): Promise<{ id: string; kind: ChannelKind; config: Record<string, unknown>; project: ProjectRecord } | null> {
  const result = await pool.query<DbRow>(
    `SELECT ch.*, p.*
     FROM channels ch
     INNER JOIN projects p ON p.id = ch.project_id
     WHERE ch.id = $1
       AND ch.kind = $2
       AND ch.status = 'active'
     LIMIT 1`,
    [channelId, kind]
  );
  if (!result.rowCount) {
    return null;
  }
  const row = result.rows[0];
  return {
    id: String(row.id),
    kind,
    config: asRecord(row.config),
    project: normalizeProjectRow(row),
  };
}

async function markWhatsappChannelVerified(channelId: string): Promise<void> {
  const result = await pool.query<DbRow>(
    `SELECT config
     FROM channels
     WHERE id = $1
       AND kind = 'whatsapp'
     LIMIT 1`,
    [channelId]
  );
  if (!result.rowCount) {
    return;
  }

  const config = deepMergeRecord(asRecord(result.rows[0].config), {
    verifiedAt: new Date().toISOString(),
    lastError: null,
  });
  await pool.query(
    `UPDATE channels
     SET config = $2::jsonb
     WHERE id = $1`,
    [channelId, JSON.stringify(config)]
  );
}

async function getOrCreateChannelConversation(
  project: ProjectRecord,
  kind: ChannelKind,
  channelId: string,
  externalThreadId: string,
  detectedLanguage: string
): Promise<string> {
  const origin = `${kind}:${channelId}:${externalThreadId}`;
  const existing = await pool.query<{ id: string }>(
    `SELECT id
     FROM conversations
     WHERE project_id = $1
       AND origin = $2
     ORDER BY created_at DESC
     LIMIT 1`,
    [project.id, origin]
  );
  if (existing.rowCount) {
    return existing.rows[0].id;
  }

  const created = await pool.query<{ id: string }>(
    `INSERT INTO conversations (project_id, site_key, origin, user_agent, detected_language)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [project.id, project.siteKey, origin, kind, detectedLanguage]
  );
  return created.rows[0].id;
}

async function buildChannelReply(params: {
  channelId: string;
  kind: ChannelKind;
  project: ProjectRecord;
  externalThreadId: string;
  message: string;
  detectedLanguage: string;
}): Promise<string> {
  const conversationId = await getOrCreateChannelConversation(
    params.project,
    params.kind,
    params.channelId,
    params.externalThreadId,
    params.detectedLanguage
  );

  try {
    const response = await fetch(`http://127.0.0.1:${process.env["PORT"] ?? "4101"}/v1/widget/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        conversationId,
        message: params.message,
      }),
    });
    const body = await response.text();
    if (!response.ok) {
      throw new Error(body || `Widget pipeline failed with ${response.status}`);
    }

    const payloadLine = body.split("\n").find((line) => line.startsWith("data: "));
    const payload = payloadLine ? JSON.parse(payloadLine.slice(6)) : null;
    const answer = payload?.payload?.message;
    if (typeof answer === "string" && answer.trim()) {
      return answer.trim();
    }
  } catch {
    // fall through to safe fallback below
  }

  return params.project.language.toLowerCase().startsWith("es")
    ? `Hola. Soy el asistente de ${params.project.botName || params.project.name}. Ahora mismo no puedo responder con contexto fiable, pero puedes dejar tus datos o volver a intentarlo.`
    : `Hello. I am the assistant for ${params.project.botName || params.project.name}. I cannot answer with reliable context right now, but you can leave your details or try again later.`;
}

async function getProjectRowForTenant(tenantId: string, projectKey: string): Promise<DbRow | null> {
  const result = await pool.query<DbRow>(
    `SELECT *
     FROM projects
     WHERE tenant_id = $1
       AND project_key = $2
     LIMIT 1`,
    [tenantId, projectKey]
  );

  return result.rows[0] ?? null;
}

async function getProjectBySiteKey(siteKey: string): Promise<ProjectRecord | null> {
  const result = await pool.query<DbRow>(
    `SELECT *
     FROM projects
     WHERE site_key = $1
     LIMIT 1`,
    [siteKey]
  );

  const row = result.rows[0];
  return row ? normalizeProjectRow(row) : null;
}

async function getProjectForTenant(tenantId: string, projectKey: string): Promise<ProjectRecord | null> {
  const row = await getProjectRowForTenant(tenantId, projectKey);
  return row ? normalizeProjectRow(row) : null;
}

async function logAnalytics(
  projectId: string,
  conversationId: string,
  eventType: string,
  payload: Record<string, unknown>
): Promise<void> {
  await pool.query(
    `INSERT INTO analytics_events (project_id, conversation_id, event_type, payload)
     VALUES ($1, $2, $3, $4::jsonb)`,
    [projectId, conversationId, eventType, JSON.stringify(payload)]
  );
}

function buildLooseTsQuery(userMessage: string): string | null {
  const tokens = userMessage
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !looseSearchStopWords.has(token));
  if (!tokens.length) {
    return null;
  }
  return [...new Set(tokens)].join(" | ");
}

function summarizeText(body: string): string {
  const cleaned = body.replace(/\s+/g, " ").trim();
  const sentences = cleaned.match(/[^.!?]+[.!?]?/g) ?? [cleaned];
  return sentences.slice(0, 2).join(" ").trim();
}

async function retrieveChunks(projectId: string, userMessage: string): Promise<RetrievedChunk[]> {
  const ranked = await pool.query<RetrievedChunk>(
    `SELECT
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
     LIMIT 8`,
    [projectId, userMessage]
  );
  if (ranked.rowCount) {
    return ranked.rows.map((row) => ({ ...row, score: Number(row.score) || 0 }));
  }

  const looseTsQuery = buildLooseTsQuery(userMessage);
  if (looseTsQuery) {
    const loose = await pool.query<RetrievedChunk>(
      `SELECT
         c.id AS "chunkId",
         c.document_id AS "documentId",
         ts_rank_cd(c.search_vector, to_tsquery('simple', $2))::float AS score,
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
         AND c.search_vector @@ to_tsquery('simple', $2)
       ORDER BY score DESC
       LIMIT 8`,
      [projectId, looseTsQuery]
    );
    if (loose.rowCount) {
      return loose.rows.map((row) => ({ ...row, score: Number(row.score) || 0 }));
    }
  }

  const fallback = await pool.query<RetrievedChunk>(
    `SELECT
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
     LIMIT 5`,
    [projectId, `%${userMessage}%`]
  );
  return fallback.rows.map((row) => ({ ...row, score: Number(row.score) || 0 }));
}

function isOriginAllowed(project: ProjectRecord, origin?: string): boolean {
  if (!origin || project.allowedDomains.length === 0) {
    return true;
  }
  try {
    const host = new URL(origin).hostname;
    if (process.env["NODE_ENV"] !== "production" && (host === "localhost" || host === "127.0.0.1")) {
      return true;
    }
    return project.allowedDomains.some((domain) => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

async function callLlm(
  project: ProjectRecord,
  userMessage: string,
  chunks: RetrievedChunk[],
  lang: string
): Promise<string | null> {
  const cfg = project.aiConfig;
  if (!cfg?.provider || !cfg?.model) {
    return null;
  }

  const context = chunks.slice(0, 4).map((chunk) => `[${chunk.title}]\n${chunk.body}`).join("\n\n---\n\n");
  const systemPrompt = [
    `Eres un asistente de preventa consultiva. Responde siempre en el idioma: ${lang}.`,
    `Usa únicamente la información del contexto proporcionado. Si no encuentras la respuesta en el contexto, indícalo claramente.`,
    `Posicionamiento: ${project.assistantProfile.positioningStatement}`,
    `Servicios relevantes: ${project.assistantProfile.serviceCatalog.join("; ")}`,
    `Objetivos de cualificación: ${project.assistantProfile.qualificationGoals.join("; ")}`,
    `Buenas siguientes acciones: ${project.assistantProfile.nextStepRules.join("; ")}`,
    cfg.systemPromptAdditions ?? "",
  ].filter(Boolean).join("\n");

  if (cfg.provider === "openai") {
    const apiKey = process.env["OPENAI_API_KEY"];
    if (!apiKey) {
      return null;
    }
    const { OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey });
    const resp = await client.chat.completions.create({
      model: cfg.model,
      temperature: cfg.temperature ?? 0.3,
      max_tokens: cfg.maxTokens ?? 512,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Contexto:\n${context}\n\nPregunta: ${userMessage}` },
      ],
    });
    return resp.choices[0]?.message?.content?.trim() ?? null;
  }

  if (cfg.provider === "anthropic") {
    const apiKey = process.env["ANTHROPIC_API_KEY"];
    if (!apiKey) {
      return null;
    }
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });
    const resp = await client.messages.create({
      model: cfg.model,
      max_tokens: cfg.maxTokens ?? 512,
      system: systemPrompt,
      messages: [{ role: "user", content: `Contexto:\n${context}\n\nPregunta: ${userMessage}` }],
    });
    const first = resp.content[0];
    return first && "text" in first ? first.text.trim() : null;
  }

  if (cfg.provider === "deepseek") {
    const apiKey = process.env["DEEPSEEK_API_KEY"];
    if (!apiKey) {
      return null;
    }
    const { OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey, baseURL: "https://api.deepseek.com" });
    const resp = await client.chat.completions.create({
      model: cfg.model,
      temperature: cfg.temperature ?? 0.3,
      max_tokens: cfg.maxTokens ?? 512,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Contexto:\n${context}\n\nPregunta: ${userMessage}` },
      ],
    });
    return resp.choices[0]?.message?.content?.trim() ?? null;
  }

  if (cfg.provider === "google") {
    const apiKey = process.env["GOOGLE_AI_API_KEY"];
    if (!apiKey) {
      return null;
    }
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const gemini = genAI.getGenerativeModel({ model: cfg.model });
    const prompt = `${systemPrompt}\n\nContexto:\n${context}\n\nPregunta: ${userMessage}`;
    const result = await gemini.generateContent(prompt);
    return result.response.text()?.trim() ?? null;
  }

  return null;
}

function detectIntent(project: ProjectRecord, userMessage: string): "service_discovery" | "qualification" | "pricing_contact" | "support_like" | "out_of_scope" | "general" {
  const normalized = userMessage
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const salesKeywords = project.ctaConfig.salesKeywords.map((item) => item.toLowerCase());

  if (
    salesKeywords.some((keyword) => normalized.includes(keyword))
    || /(precio|presupuesto|demo|reunion|cotizacion|hablar con|contact|agendar|comercial)/.test(normalized)
  ) {
    return "pricing_contact";
  }

  if (/(servicios?|soluciones?|automatiz|software|chatbot|chatbots|ia\b|inteligencia artificial|saas|consultor)/.test(normalized)) {
    return "service_discovery";
  }

  if (/(mi caso|necesito|busco|tenemos|queremos|proceso|operacion|equipo|empresa|objetivo|plazo|integrar|integracion)/.test(normalized)) {
    return "qualification";
  }

  if (/(error|bug|incidencia|fallo|soporte tecnico|ticket|contraseña|password|login)/.test(normalized)) {
    return "support_like";
  }

  if (/(quien eres|que puedes hacer|help|ayuda)/.test(normalized)) {
    return "general";
  }

  return "general";
}

function scoreCommercialIntentLocal(message: string, keywords: string[]): number {
  const lowered = message.toLowerCase();
  return keywords.reduce((score, keyword) => {
    return lowered.includes(keyword.toLowerCase()) ? score + 1 : score;
  }, 0);
}

function selectTopChunksLocal(chunks: RetrievedChunk[], limit = 4): RetrievedChunk[] {
  return [...chunks].sort((left, right) => right.score - left.score).slice(0, limit);
}

function buildSuggestionPrompt(language: string, service: string): WidgetSuggestionItem {
  const isSpanish = language.toLowerCase().startsWith("es");
  return {
    label: service,
    prompt: isSpanish
      ? `Quiero valorar ${service.toLowerCase()} para mi caso.`
      : `I want to evaluate ${service.toLowerCase()} for my case.`,
    kind: "service",
  };
}

function buildSuggestions(
  project: ProjectRecord,
  intent: ReturnType<typeof detectIntent>,
  userMessage: string
): WidgetSuggestionBlock | undefined {
  const isSpanish = project.language.toLowerCase().startsWith("es");
  const maxItems = Math.max(1, Math.min(3, project.runtimePolicy.maxDesktopSuggestions));
  if (intent === "service_discovery") {
    const items = project.assistantProfile.serviceCatalog
      .slice(0, maxItems)
      .map((service) => buildSuggestionPrompt(project.language, service));
    return items.length ? { slot: "services", items } : undefined;
  }

  if (intent === "qualification") {
    const prompts = [
      isSpanish
        ? "Te explico el proceso actual que quiero mejorar."
        : "I can explain the current process I want to improve.",
      isSpanish
        ? "Te cuento el objetivo de negocio y el contexto técnico."
        : "I can share the business goal and technical context.",
      isSpanish
        ? "Quiero entender el siguiente paso recomendado."
        : "I want to understand the recommended next step.",
    ];
    return {
      slot: "qualification",
      items: prompts.slice(0, maxItems).map((prompt, index) => ({
        label: project.assistantProfile.qualificationGoals[index] ?? (isSpanish ? "Siguiente paso" : "Next step"),
        prompt,
        kind: "qualification",
      })),
    };
  }

  if (intent === "pricing_contact") {
    const items: WidgetSuggestionItem[] = [
      {
        label: isSpanish ? "Pedir reunión" : "Request meeting",
        prompt: isSpanish
          ? "Quiero agendar una reunión de descubrimiento con vuestro equipo."
          : "I want to schedule a discovery meeting with your team.",
        kind: "contact",
      },
      {
        label: isSpanish ? "Explicar mi caso" : "Share my case",
        prompt: isSpanish
          ? "Voy a resumir mi caso y qué resultado espero conseguir."
          : "I will summarise my case and the outcome I want to achieve.",
        kind: "qualification",
      },
    ];
    return { slot: "follow_up", items: items.slice(0, maxItems) };
  }

  if (intent === "general" && /servicio|automatiz|software|chatbot|saas|ia/i.test(userMessage)) {
    return {
      slot: "services",
      items: project.assistantProfile.serviceCatalog.slice(0, maxItems).map((service) => buildSuggestionPrompt(project.language, service)),
    };
  }

  return undefined;
}

function buildSafeFallbackAnswer(project: ProjectRecord): WidgetAnswer {
  return {
    message: project.promptPolicy.outOfScopeMessage,
    citations: [],
    cta: {
      label: project.ctaConfig.primaryLabel,
      url: project.ctaConfig.primaryUrl,
    },
    confidence: 0.15,
    usedFallback: true,
  };
}

function composeGroundedAnswer(
  project: ProjectRecord,
  userMessage: string,
  chunks: RetrievedChunk[],
  lang: string,
  intent: ReturnType<typeof detectIntent>
): WidgetAnswer {
  if (!chunks.length || Number(chunks[0]?.score ?? 0) < 0.005) {
    return buildSafeFallbackAnswer(project);
  }

  const topChunks = selectTopChunksLocal(chunks, 4);
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

  const isSpanish = lang.toLowerCase().startsWith("es");
  const consultativeBridge = intent === "service_discovery"
    ? (
      isSpanish
        ? "Si me cuentas el reto o proceso que quieres mejorar, puedo orientarte al servicio de Tecnoria más adecuado."
        : "If you share the business problem or process you want to improve, I can guide you to the right service."
    )
    : intent === "qualification"
      ? (
        isSpanish
          ? "Si quieres, aterrizamos el caso, el stack actual y el siguiente paso más útil."
          : "If you want, we can ground the case, the current stack and the most useful next step."
      )
      : intent === "pricing_contact"
        ? (
          isSpanish
            ? "Si encaja, también puedo llevarte a una demo o a una conversación con el equipo."
            : "If it makes sense, I can also move this to a demo or a conversation with the team."
        )
        : "";

  const citations = topChunks.slice(0, 3).map((chunk) => ({
    title: chunk.title,
    url: chunk.canonicalUrl,
    snippet: summarizeText(chunk.body),
  }));

  return {
    message: [uniqueParagraphs[0], uniqueParagraphs.slice(1).join(" "), consultativeBridge].filter(Boolean).join("\n\n"),
    citations,
    confidence: Math.min(0.95, 0.45 + Number(topChunks[0].score)),
    usedFallback: false,
  };
}

async function buildWidgetAnswer(
  project: ProjectRecord,
  userMessage: string,
  chunks: RetrievedChunk[],
  lang: string
): Promise<WidgetAnswer> {
  const intent = detectIntent(project, userMessage);
  const llmText = await callLlm(project, userMessage, chunks, lang).catch(() => null);
  const topChunks = selectTopChunksLocal(chunks, 4);
  const citations = topChunks.slice(0, 3).map((chunk) => ({
    title: chunk.title,
    url: chunk.canonicalUrl,
    snippet: summarizeText(chunk.body),
  }));
  const commercialIntent = scoreCommercialIntentLocal(userMessage, project.ctaConfig.salesKeywords);
  const shouldEscalate = commercialIntent >= project.runtimePolicy.commercialIntentThreshold
    || intent === "pricing_contact";

  const answer: WidgetAnswer = llmText?.trim()
    ? {
        message: llmText.trim(),
        citations,
        cta: undefined,
        confidence: citations.length ? 0.9 : 0.72,
        usedFallback: false,
      }
    : composeGroundedAnswer(project, userMessage, chunks, lang, intent);

  const suggestions = answer.usedFallback ? undefined : buildSuggestions(project, intent, userMessage);
  return {
    ...answer,
    cta: shouldEscalate || (intent === "service_discovery" && Boolean(project.enableHandover))
      ? {
          label: project.ctaConfig.primaryLabel,
          url: project.ctaConfig.primaryUrl,
        }
      : answer.cta,
    suggestions,
  };
}

function isTecnoriaSeed(seed: {
  projectKey: string;
  name: string;
  botName: string;
  language: string;
  metadata: Record<string, unknown>;
}): boolean {
  const domains = normalizeStringArray(asRecord(seed.metadata["siteProfile"])["allowedDomains"]) ?? [];
  return seed.projectKey === "tecnoria"
    || /tecnoria/i.test(seed.name)
    || /tecnoria/i.test(seed.botName)
    || domains.some((item) => /tecnoria/i.test(item));
}

function defaultAssistantProfile(seed: {
  projectKey: string;
  name: string;
  botName: string;
  language: string;
  metadata: Record<string, unknown>;
}): AssistantProfile {
  if (isTecnoriaSeed(seed)) {
    return {
      positioningStatement: "Asistente de preventa consultiva para software a medida, automatización e IA aplicada a operaciones reales.",
      serviceCatalog: tecnoriaServiceCatalog,
      qualificationGoals: [
        "Entender el reto de negocio y el proceso actual",
        "Detectar stack, restricciones y urgencia",
        "Orientar al servicio que mejor encaja",
        "Proponer un siguiente paso claro con el equipo",
      ],
      nextStepRules: [
        "Si hay intención comercial, ofrecer demo o reunión de descubrimiento",
        "Si preguntan por servicios, pedir contexto y orientar al servicio más cercano",
        "Si falta contexto, hacer una sola pregunta útil de cualificación",
      ],
      servicePromptLibrary: tecnoriaPromptLibrary,
    };
  }

  const label = seed.botName || seed.name || "el asistente";
  const isSpanish = seed.language.toLowerCase().startsWith("es");
  return {
    positioningStatement: isSpanish
      ? `Asistente consultivo de ${label}, centrado en entender el caso, orientar el mejor encaje y proponer el siguiente paso.`
      : `Consultative assistant for ${label}, focused on understanding the case, guiding the best fit and proposing the next step.`,
    serviceCatalog: isSpanish
      ? ["Servicios principales", "Integraciones", "Automatización", "Consultoría"]
      : ["Core services", "Integrations", "Automation", "Consulting"],
    qualificationGoals: isSpanish
      ? ["Entender objetivo", "Aclarar contexto", "Definir siguiente paso"]
      : ["Understand the goal", "Clarify context", "Define the next step"],
    nextStepRules: isSpanish
      ? ["Orientar con una siguiente acción clara", "Escalar a demo cuando haya intención comercial"]
      : ["Guide toward a clear next action", "Escalate to demo when commercial intent is present"],
    servicePromptLibrary: isSpanish
      ? [
          `¿Cómo puede ayudarme ${label} en mi caso?`,
          `¿Qué servicios ofrece ${label}?`,
          `Quiero hablar con el equipo de ${label}.`,
        ]
      : [
          `How can ${label} help in my case?`,
          `What services does ${label} offer?`,
          `I want to speak with the ${label} team.`,
        ],
  };
}

function defaultRuntimePolicy(seed: {
  projectKey: string;
  name: string;
  botName: string;
  language: string;
  metadata: Record<string, unknown>;
}): RuntimePolicy {
  return {
    posture: isTecnoriaSeed(seed) ? "preventa consultiva" : "copiloto consultivo",
    scope: isTecnoriaSeed(seed) ? "Tecnoria + plantilla" : `${seed.name || seed.botName} + plantilla`,
    roadmapDepth: "ahora + después",
    maxMobileSuggestions: 2,
    maxDesktopSuggestions: 3,
    commercialIntentThreshold: 1,
    hideStartersAfterFirstUserMessage: true,
  };
}

function normalizeAssistantProfile(
  value: unknown,
  seed: {
    projectKey: string;
    name: string;
    botName: string;
    language: string;
    metadata: Record<string, unknown>;
  }
): AssistantProfile {
  const defaults = defaultAssistantProfile(seed);
  const raw = asRecord(value);
  return {
    positioningStatement: normalizeOptionalString(raw["positioningStatement"], defaults.positioningStatement) ?? defaults.positioningStatement,
    serviceCatalog: normalizeStringArray(raw["serviceCatalog"]) ?? defaults.serviceCatalog,
    qualificationGoals: normalizeStringArray(raw["qualificationGoals"]) ?? defaults.qualificationGoals,
    nextStepRules: normalizeStringArray(raw["nextStepRules"]) ?? defaults.nextStepRules,
    servicePromptLibrary: sanitizeStarterQuestions(raw["servicePromptLibrary"]) ?? defaults.servicePromptLibrary,
  };
}

function normalizeRuntimePolicy(
  value: unknown,
  seed: {
    projectKey: string;
    name: string;
    botName: string;
    language: string;
    metadata: Record<string, unknown>;
  }
): RuntimePolicy {
  const defaults = defaultRuntimePolicy(seed);
  const raw = asRecord(value);
  return {
    posture: normalizeOptionalString(raw["posture"], defaults.posture) ?? defaults.posture,
    scope: normalizeOptionalString(raw["scope"], defaults.scope) ?? defaults.scope,
    roadmapDepth: normalizeOptionalString(raw["roadmapDepth"], defaults.roadmapDepth) ?? defaults.roadmapDepth,
    maxMobileSuggestions: clampInteger(raw["maxMobileSuggestions"], 1, 2, defaults.maxMobileSuggestions),
    maxDesktopSuggestions: clampInteger(raw["maxDesktopSuggestions"], 1, 3, defaults.maxDesktopSuggestions),
    commercialIntentThreshold: clampInteger(raw["commercialIntentThreshold"], 1, 5, defaults.commercialIntentThreshold),
    hideStartersAfterFirstUserMessage: typeof raw["hideStartersAfterFirstUserMessage"] === "boolean"
      ? Boolean(raw["hideStartersAfterFirstUserMessage"])
      : defaults.hideStartersAfterFirstUserMessage,
  };
}

function normalizeProjectRow(row: DbRow): ProjectRecord {
  const metadata = asRecord(row.metadata);
  const seed = {
    projectKey: String(row.project_key),
    name: String(row.name),
    botName: String(row.bot_name),
    language: String(row.language ?? "es"),
    metadata,
  };
  const assistantProfile = normalizeAssistantProfile(metadata["assistantProfile"], seed);
  const runtimePolicy = normalizeRuntimePolicy(metadata["runtimePolicy"], seed);
  const ctaConfig: CTAConfig = {
    ...defaultCtaConfig,
    ...asRecord(row.cta_config),
    salesKeywords: normalizeStringArray(asRecord(row.cta_config).salesKeywords) ?? defaultCtaConfig.salesKeywords,
  };
  const promptPolicy: PromptPolicy = {
    ...defaultPromptPolicy,
    ...asRecord(row.prompt_policy),
    guardrails: normalizeStringArray(asRecord(row.prompt_policy).guardrails) ?? defaultPromptPolicy.guardrails,
    disallowPricing: typeof asRecord(row.prompt_policy).disallowPricing === "boolean"
      ? Boolean(asRecord(row.prompt_policy).disallowPricing)
      : defaultPromptPolicy.disallowPricing,
  };
  const baseProject: ProjectRecord = {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    projectKey: String(row.project_key),
    name: String(row.name),
    siteKey: String(row.site_key),
    status: normalizeStatus(row.status),
    publicBaseUrl: row.public_base_url ? String(row.public_base_url) : null,
    metadata,
    language: String(row.language ?? "es"),
    allowedDomains: Array.isArray(row.allowed_domains) ? row.allowed_domains.map(String) : [],
    botName: String(row.bot_name),
    welcomeMessage: String(row.welcome_message),
    promptPolicy,
    ctaConfig,
    assistantProfile,
    runtimePolicy,
    widgetTheme: compactObject({
      ...defaultWidgetTheme,
      ...asRecord(row.widget_theme),
      launcherEyebrow: normalizeOptionalString(asRecord(row.widget_theme).launcherEyebrow),
      launcherIcon: normalizeOptionalString(asRecord(row.widget_theme).launcherIcon),
      botCopy: normalizeOptionalString(asRecord(row.widget_theme).botCopy)
        ?? deriveBotCopyFromParts(
          String(row.bot_name ?? row.name ?? "Asistente"),
          String(row.language ?? "es"),
          metadata,
          String(row.welcome_message ?? ""),
          assistantProfile
        ),
      logoUrl: normalizeOptionalString(asRecord(row.widget_theme).logoUrl),
      proactiveMessage: normalizeOptionalString(asRecord(row.widget_theme).proactiveMessage),
      composerPlaceholder: normalizeOptionalString(asRecord(row.widget_theme).composerPlaceholder, defaultWidgetTheme.composerPlaceholder),
      sendButtonLabel: normalizeOptionalString(asRecord(row.widget_theme).sendButtonLabel, defaultWidgetTheme.sendButtonLabel),
    }),
    enableHandover: Boolean(row.enable_handover),
    aiConfig: compactObject({
      ...asRecord(row.ai_config),
    }),
    languageMode: row.language_mode === "auto" ? "auto" : "fixed",
    starterQuestions: [],
  };

  baseProject.starterQuestions = resolveStarterQuestions(baseProject);
  return baseProject;
}

function resolveStarterQuestions(project: ProjectRecord): string[] {
  const runtime = asRecord(project.metadata["widgetRuntime"]);
  const stored = sanitizeStarterQuestions(runtime["starterQuestions"]);
  if (stored) {
    return stored;
  }

  const profiled = sanitizeStarterQuestions(project.assistantProfile.servicePromptLibrary);
  if (profiled) {
    return profiled;
  }

  if (project.assistantProfile.serviceCatalog.length) {
    const isSpanish = project.language.toLowerCase().startsWith("es");
    const servicePrompts = project.assistantProfile.serviceCatalog.slice(0, 4).map((service, index) => {
      if (index === 0) {
        return isSpanish
          ? `Quiero explorar ${service.toLowerCase()} para mi caso.`
          : `I want to explore ${service.toLowerCase()} for my case.`;
      }
      if (index === 1) {
        return isSpanish
          ? `¿Cómo abordaríais ${service.toLowerCase()} en una empresa como la mía?`
          : `How would you approach ${service.toLowerCase()} for a company like mine?`;
      }
      return isSpanish
        ? `Quiero valorar ${service.toLowerCase()}.`
        : `I want to evaluate ${service.toLowerCase()}.`;
    });
    if (servicePrompts.length) {
      return servicePrompts;
    }
  }

  const brand = project.botName || project.name || "el asistente";
  const isSpanish = project.language.toLowerCase().startsWith("es");
  if (isSpanish) {
    return [
      `¿Qué hace ${brand} exactamente?`,
      `¿Qué servicios o soluciones ofrece ${brand}?`,
      `¿Cómo puede ayudarme ${brand} en mi caso?`,
      `Quiero hablar con el equipo de ${brand}`,
    ];
  }

  return [
    `What does ${brand} do exactly?`,
    `What services or solutions does ${brand} offer?`,
    `How can ${brand} help in my case?`,
    `I want to speak with the ${brand} team`,
  ];
}

function sanitizeStarterQuestions(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const items = value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean)
    .slice(0, 12);
  return items.length ? items : null;
}

function deriveBotCopy(project: ProjectRecord): string {
  return deriveBotCopyFromParts(
    project.botName,
    project.language,
    project.metadata,
    project.welcomeMessage,
    project.assistantProfile
  );
}

function deriveBotCopyFromParts(
  botName: string,
  language: string,
  metadata: Record<string, unknown>,
  welcomeMessage: string,
  assistantProfile?: AssistantProfile
): string {
  const siteProfile = asRecord(metadata["siteProfile"]);
  const siteName = normalizeOptionalString(siteProfile["siteName"]);
  const copyHint = normalizeStringArray(siteProfile["copyHints"])?.[0];
  if (copyHint) {
    return copyHint;
  }

  if (assistantProfile?.positioningStatement) {
    return assistantProfile.positioningStatement;
  }

  if (welcomeMessage) {
    return welcomeMessage;
  }

  const label = siteName ?? botName ?? "el asistente";
  if (language.toLowerCase().startsWith("es")) {
    return `Consultas sobre ${label}, servicios y contacto.`;
  }

  return `Questions about ${label}, services and next steps.`;
}

function normalizeStatus(value: unknown): "active" | "draft" | "disabled" {
  return value === "draft" || value === "disabled" ? value : "active";
}

function asRecord(value: unknown): Record<string, any> {
  return isPlainObject(value) ? value : {};
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMergeRecord(
  left: Record<string, unknown>,
  right: Record<string, unknown>
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...left };
  for (const [key, value] of Object.entries(right)) {
    if (value === undefined) {
      continue;
    }

    if (isPlainObject(value) && isPlainObject(merged[key])) {
      merged[key] = deepMergeRecord(merged[key] as Record<string, unknown>, value);
      continue;
    }

    merged[key] = value;
  }
  return merged;
}

function normalizeOptionalString(value: unknown, fallback?: string): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
    return undefined;
  }
  return fallback;
}

function normalizeStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const items = value.map((item) => String(item ?? "").trim()).filter(Boolean);
  return items.length ? items : null;
}

function clampInteger(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function compactObject<T extends Record<string, any>>(value: T): T {
  const entries = Object.entries(value).filter(([, item]) => item !== undefined);
  return Object.fromEntries(entries) as T;
}

function readAnalyticsPeriod(value: unknown): { label: "7d" | "30d" | "90d"; days: number } {
  if (value === "7d") {
    return { label: "7d", days: 7 };
  }
  if (value === "90d") {
    return { label: "90d", days: 90 };
  }
  return { label: "30d", days: 30 };
}

async function buildProjectSnippetResponse(project: ProjectRecord): Promise<{
  siteKey: string;
  apiBase: string;
  widgetBaseUrl: string;
  snippet: string;
}> {
  const settings = await getCanonicalEmbedSettings();
  return {
    siteKey: project.siteKey,
    apiBase: settings.apiBase,
    widgetBaseUrl: settings.widgetBaseUrl,
    snippet: buildCanonicalWidgetSnippet({
      siteKey: project.siteKey,
      apiBase: settings.apiBase,
      widgetBaseUrl: settings.widgetBaseUrl,
      assetVersion: settings.assetVersion,
    }),
  };
}

async function getCanonicalEmbedSettings(): Promise<{
  apiBase: string;
  widgetBaseUrl: string;
  assetVersion: string | null;
}> {
  const result = await pool.query<{
    api_base_url: string | null;
    widget_base_url: string | null;
  }>(
    `SELECT api_base_url, widget_base_url
     FROM platform_settings
     WHERE id = 'default'
     LIMIT 1`
  );

  const apiBase = normalizeOptionalString(result.rows[0]?.api_base_url, publicApiBase) ?? publicApiBase;
  const widgetBaseUrl = normalizeOptionalString(
    result.rows[0]?.widget_base_url,
    `${publicPortalUrl}/widget/`
  ) ?? `${publicPortalUrl}/widget/`;

  return {
    apiBase,
    widgetBaseUrl: widgetBaseUrl.endsWith("/") ? widgetBaseUrl : `${widgetBaseUrl}/`,
    assetVersion: normalizeOptionalString(process.env["CHAT_WIDGET_ASSET_VERSION"]) ?? null,
  };
}

async function provisionWebsiteIntegration(
  project: ProjectRecord,
  baseUrl: string,
  requestedBy: string
): Promise<{
  detectedMode: "sitemap" | "html";
  sourceKey: string;
  entryUrl: string;
  allowedDomains: string[];
  ingestionJobId: string;
  snippet: string;
}> {
  const normalizedBaseUrl = normalizeWebsiteBaseUrl(baseUrl);
  const discovery = await discoverWebsiteEntry(normalizedBaseUrl);
  const inferredDomains = inferAllowedDomains(normalizedBaseUrl);
  const nextAllowedDomains = [...new Set([...project.allowedDomains, ...inferredDomains])];
  const sourceKey = canonicalWebsiteSourceKey();
  const nextMetadata = deepMergeRecord(project.metadata, {
    websiteIntegration: {
      sourceKey,
      detectedMode: discovery.detectedMode,
      entryUrl: discovery.entryUrl,
      baseUrl: normalizedBaseUrl,
      configuredAt: new Date().toISOString(),
    },
  });

  await pool.query(
    `UPDATE projects
     SET allowed_domains = $2,
         public_base_url = $3,
         metadata = $4::jsonb,
         updated_at = NOW()
     WHERE id = $1`,
    [
      project.id,
      nextAllowedDomains,
      normalizedBaseUrl,
      JSON.stringify(nextMetadata),
    ]
  );

  const source = await pool.query<{ id: string }>(
    `INSERT INTO sources (
       project_id,
       source_key,
       kind,
       entry_url,
       include_patterns,
       exclude_patterns,
       allowed_domains,
       visibility,
       default_category,
       source_config
     )
     VALUES ($1, $2, $3, $4, '{}', '{}', $5, 'public', NULL, $6::jsonb)
     ON CONFLICT (project_id, source_key)
     DO UPDATE SET
       kind = EXCLUDED.kind,
       entry_url = EXCLUDED.entry_url,
       include_patterns = EXCLUDED.include_patterns,
       exclude_patterns = EXCLUDED.exclude_patterns,
       allowed_domains = EXCLUDED.allowed_domains,
       visibility = EXCLUDED.visibility,
       default_category = EXCLUDED.default_category,
       source_config = EXCLUDED.source_config,
       updated_at = NOW()
     RETURNING id`,
    [
      project.id,
      sourceKey,
      discovery.detectedMode,
      discovery.entryUrl,
      nextAllowedDomains,
      JSON.stringify({
        normalizedBaseUrl,
        provisioner: "website-integration",
        requestedBy,
      }),
    ]
  );

  const ingestionJob = await pool.query<{ id: string }>(
    `INSERT INTO ingestion_jobs (project_id, source_id, status, requested_by)
     VALUES ($1, $2, 'queued', $3)
     RETURNING id`,
    [project.id, source.rows[0].id, requestedBy]
  );

  const refreshedProject = await getProjectBySiteKey(project.siteKey);
  const snippet = refreshedProject
    ? (await buildProjectSnippetResponse(refreshedProject)).snippet
    : (await buildProjectSnippetResponse({
      ...project,
      allowedDomains: nextAllowedDomains,
      metadata: nextMetadata,
      publicBaseUrl: normalizedBaseUrl,
    })).snippet;

  return {
    detectedMode: discovery.detectedMode,
    sourceKey,
    entryUrl: discovery.entryUrl,
    allowedDomains: nextAllowedDomains,
    ingestionJobId: ingestionJob.rows[0].id,
    snippet,
  };
}

export { app, env, pool };
