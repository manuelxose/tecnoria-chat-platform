// @ts-nocheck
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import morgan from "morgan";
import nodemailer from "nodemailer";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { Pool } from "pg";
import { buildFallbackAnswer, scoreCommercialIntent, selectTopChunks, } from "@tecnoria-chat/core";
import { z } from "zod";
const envSchema = z.object({
    NODE_ENV: z.string().default("development"),
    PORT: z.coerce.number().default(4101),
    DATABASE_URL: z.string().min(1),
    CORS_ORIGIN: z
        .string()
        .default("http://localhost:4101,http://localhost:4102,http://localhost:4103,http://localhost:4200,http://localhost:4000"),
    ADMIN_BEARER_TOKEN: z.string().min(1),
    LEAD_WEBHOOK_SHARED_SECRET: z.string().min(1),
    DEFAULT_LEAD_WEBHOOK_URL: z.string().url().default("http://localhost:3001/api/v1/contact"),
    COOKIE_NAME: z.string().default("chat_console_session"),
    JWT_SECRET: z.string().min(16),
    PORTAL_PUBLIC_URL: z.string().url().default("http://localhost:4103"),
    PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().min(5).max(1440).default(60),
    SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(168).default(8),
    SMTP_HOST: z.string().default(""),
    SMTP_PORT: z.coerce.number().int().positive().default(1025),
    SMTP_USER: z.string().default(""),
    SMTP_PASS: z.string().default(""),
    SMTP_FROM: z.string().default("Talkaris <hello@talkaris.com>"),
    AUCTORIO_PUBLISHER_TOKEN: z.string().default(""),
    BLOG_REINGEST_PROJECT_KEY: z.string().default("talkaris"),
    BLOG_REINGEST_SOURCE_KEY: z.string().default("public-site"),
    OPENAI_API_KEY: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    DEEPSEEK_API_KEY: z.string().optional(),
    GOOGLE_AI_API_KEY: z.string().optional(),
    TELEGRAM_WEBHOOK_SECRET: z.string().default("talkaris-tg-secret"),
});
const env = envSchema.parse(process.env);
const pool = new Pool({ connectionString: env.DATABASE_URL });
const app = express();
const allowedOrigins = env.CORS_ORIGIN.split(",").map((item) => item.trim()).filter(Boolean);
const mailTransport = env.SMTP_HOST
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: false,
        auth: env.SMTP_USER
            ? {
                user: env.SMTP_USER,
                pass: env.SMTP_PASS,
            }
            : undefined,
    })
    : null;
app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
const defaultPromptPolicy = {
    tone: "profesional, sobrio y orientado a negocio",
    outOfScopeMessage: "No tengo contexto suficiente para responder eso con seguridad. Si quieres, puedo orientarte a la funcionalidad adecuada o a solicitar una demo.",
    guardrails: [
        "No inventar servicios",
        "No inventar precios",
        "No salir del dominio de conocimiento autorizado",
    ],
    disallowPricing: true,
};
const defaultCtaConfig = {
    primaryLabel: "Solicitar demo",
    primaryUrl: "https://talkaris.com/solicitar-demo",
    secondaryLabel: "Ver funcionalidades",
    secondaryUrl: "https://talkaris.com/funcionalidades",
    salesKeywords: ["precio", "presupuesto", "contacto", "demo", "reunion", "contratar"],
};
const defaultWidgetTheme = {
    accentColor: "#00c2a8",
    surfaceColor: "#09111f",
    textColor: "#f5f7fb",
    launcherLabel: "Talk to Talkaris",
};
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
const createProjectSchema = z.object({
    projectKey: z.string().min(2),
    name: z.string().min(2),
    language: z.string().default("es"),
    allowedDomains: z.array(z.string()).default([]),
    botName: z.string().default("Talkaris Assistant"),
    welcomeMessage: z.string().default("Hola. Soy el asistente de Talkaris y puedo ayudarte con integraciones, soporte, seguridad y contacto."),
    promptPolicy: z.any().optional(),
    ctaConfig: z.any().optional(),
    widgetTheme: z.any().optional(),
    leadSink: z.any().optional(),
    siteKey: z.string().min(6).optional(),
    tenantId: z.string().uuid().optional(),
    tenantSlug: z.string().min(2).optional(),
    status: z.enum(["active", "draft", "disabled"]).default("active"),
    publicBaseUrl: z.string().url().optional(),
    metadata: z.record(z.any()).default({}),
    languageMode: z.enum(["fixed", "auto"]).default("fixed"),
});
const sourceSchema = z.object({
    projectKey: z.string().min(2),
    sourceKey: z.string().min(2),
    kind: z.enum(["sitemap", "html", "pdf", "markdown", "api_endpoint", "youtube", "notion", "gemini_file"]),
    entryUrl: z.string().url(),
    includePatterns: z.array(z.string()).default([]),
    excludePatterns: z.array(z.string()).default([]),
    allowedDomains: z.array(z.string()).default([]),
    visibility: z.enum(["public", "private"]).default("public"),
    defaultCategory: z.string().optional(),
    sourceConfig: z.record(z.unknown()).optional(),
});
const ingestionSchema = z.object({
    projectKey: z.string().min(2),
    sourceKey: z.string().min(2),
    requestedBy: z.string().optional(),
});
const sessionSchema = z.object({
    siteKey: z.string().min(6),
    origin: z.string().optional(),
    detectedLanguage: z.string().max(10).optional(),
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
const accessRequestSchema = z.object({
    name: z.string().trim().min(2),
    company: z.string().trim().min(2),
    email: z.string().trim().email().transform((value) => value.toLowerCase()),
    phone: z.string().trim().max(40).optional(),
    message: z.string().trim().max(2000).optional(),
    requestedTenantName: z.string().trim().min(2).optional(),
});
const loginSchema = z.object({
    email: z.string().trim().email().transform((value) => value.toLowerCase()),
    password: z.string().min(8),
});
const passwordRequestSchema = z.object({
    email: z.string().trim().email().transform((value) => value.toLowerCase()),
});
const passwordResetSchema = z.object({
    token: z.string().min(24),
    password: z.string().min(8),
});
const reviewAccessRequestSchema = z.object({
    decision: z.enum(["accepted", "rejected"]),
    notes: z.string().max(2000).optional(),
    tenantName: z.string().min(2).optional(),
    tenantSlug: z.string().min(2).optional(),
    displayName: z.string().min(2).optional(),
});
const tenantSchema = z.object({
    id: z.string().uuid().optional(),
    slug: z.string().min(2),
    name: z.string().min(2),
    status: z.enum(["active", "pending", "disabled"]).default("active"),
    brandName: z.string().optional(),
    publicBaseUrl: z.string().url().optional(),
    metadata: z.record(z.any()).default({}),
});
const blogUpsertSchema = z.object({
    slug: z.string().trim().min(3),
    locale: z.enum(["es", "en"]).default("en"),
    title: z.string().trim().min(3),
    summary: z.string().trim().min(3),
    bodyHtml: z.string().trim().min(3),
    imageUrl: z.string().url().optional().nullable(),
    tags: z.array(z.string().trim().min(1)).default([]),
    author: z.string().trim().min(2).default("Talkaris Team"),
    category: z.string().trim().min(2).optional().nullable(),
    status: z.enum(["draft", "publish"]).default("draft"),
    seoTitle: z.string().trim().min(2).optional().nullable(),
    seoDescription: z.string().trim().min(2).optional().nullable(),
    publishedAt: z.string().datetime().optional().nullable(),
});
const userSchema = z.object({
    id: z.string().uuid().optional(),
    email: z.string().email(),
    displayName: z.string().optional(),
    platformRole: z.enum(["superadmin", "member"]).default("member"),
    status: z.enum(["pending", "active", "disabled"]).default("pending"),
    password: z.string().min(8).optional(),
});
const membershipSchema = z.object({
    tenantId: z.string().uuid(),
    userId: z.string().uuid(),
    role: z.enum(["admin", "editor", "viewer"]),
});
const platformSettingsSchema = z.object({
    brandName: z.string().min(2).optional(),
    legalName: z.string().min(2).optional(),
    tagline: z.string().min(2).optional(),
    summary: z.string().min(2).optional(),
    supportEmail: z.string().email().optional(),
    websiteUrl: z.string().url().optional(),
    productDomain: z.string().min(2).optional(),
    portalBaseUrl: z.string().url().optional(),
    apiBaseUrl: z.string().url().optional(),
    widgetBaseUrl: z.string().url().optional(),
    developedBy: z.string().min(2).optional(),
    demoProjectKey: z.string().min(2).optional(),
    demoSiteKey: z.string().min(6).optional(),
    defaultLocale: z.string().min(2).optional(),
    supportedLocales: z.array(z.string().min(2)).optional(),
    seoTitle: z.string().min(2).optional(),
    seoDescription: z.string().min(2).optional(),
    seoKeywords: z.array(z.string().min(2)).optional(),
    seoImageUrl: z.string().url().optional(),
    organizationName: z.string().min(2).optional(),
    contactEmail: z.string().email().optional(),
    heroPoints: z.array(z.string()).optional(),
    featureFlags: z.record(z.boolean()).optional(),
});
const listQuerySchema = z.object({
    projectKey: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50),
});
const blockedPublicEmailDomains = new Set([
    "example.com",
    "example.org",
    "example.net",
    "localhost",
    "test.com",
]);
const rateLimitBuckets = new Map();
function asyncHandler(handler) {
    return (req, res, next) => {
        Promise.resolve(handler(req, res, next)).catch(next);
    };
}
function normalizeEmail(email) {
    return email.trim().toLowerCase();
}
function isAllowedPublicEmail(email) {
    const normalized = normalizeEmail(email);
    const [, domain = ""] = normalized.split("@");
    if (!domain || blockedPublicEmailDomains.has(domain)) {
        return false;
    }
    return !domain.endsWith(".local") && !domain.endsWith(".invalid");
}
function getRequestIp(req) {
    const forwarded = req.headers["cf-connecting-ip"] ?? req.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.trim()) {
        return forwarded.split(",")[0].trim();
    }
    return req.ip || "unknown";
}
function rateLimitByIp(name, limit, windowMs) {
    return (req, res, next) => {
        const now = Date.now();
        const bucketKey = `${name}:${getRequestIp(req)}`;
        const current = rateLimitBuckets.get(bucketKey);
        if (!current || current.resetAt <= now) {
            rateLimitBuckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
            next();
            return;
        }
        current.count += 1;
        if (current.count > limit) {
            res.setHeader("retry-after", Math.ceil((current.resetAt - now) / 1000));
            res.status(429).json({ code: "RATE_LIMITED", message: "Too many requests. Try again later." });
            return;
        }
        next();
    };
}
function normalizeProject(row) {
    return {
        id: row.id,
        tenantId: row.tenant_id,
        projectKey: row.project_key,
        name: row.name,
        siteKey: row.site_key,
        status: row.status ?? "active",
        publicBaseUrl: row.public_base_url ?? null,
        metadata: row.metadata ?? {},
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
            secretHeaderName: row.lead_sink?.secretHeaderName ?? "x-talkaris-chat-secret",
        },
        enableHandover: row.enable_handover ?? false,
        aiConfig: row.ai_config ?? {},
        languageMode: (row.language_mode === "auto" ? "auto" : "fixed"),
    };
}
function normalizeTenant(row) {
    return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        status: row.status,
        brandName: row.brand_name ?? null,
        publicBaseUrl: row.public_base_url ?? null,
        metadata: row.metadata ?? {},
    };
}
function normalizeMembership(row) {
    return {
        id: row.id,
        tenantId: row.tenant_id,
        userId: row.user_id,
        role: row.role,
        tenantName: row.tenant_name,
        tenantSlug: row.tenant_slug,
    };
}
function normalizePlatformSettings(row) {
    return {
        id: row.id,
        brandName: row.brand_name,
        legalName: row.legal_name,
        tagline: row.tagline,
        summary: row.summary,
        supportEmail: row.support_email,
        websiteUrl: row.website_url,
        productDomain: row.product_domain,
        portalBaseUrl: row.portal_base_url,
        apiBaseUrl: row.api_base_url,
        widgetBaseUrl: row.widget_base_url,
        developedBy: row.developed_by,
        demoProjectKey: row.demo_project_key,
        demoSiteKey: row.demo_site_key,
        defaultLocale: row.default_locale ?? "es",
        supportedLocales: Array.isArray(row.supported_locales)
            ? row.supported_locales.filter((value) => typeof value === "string")
            : ["es", "en"],
        seoTitle: row.seo_title ?? row.brand_name,
        seoDescription: row.seo_description ?? row.summary,
        seoKeywords: Array.isArray(row.seo_keywords)
            ? row.seo_keywords.filter((value) => typeof value === "string")
            : [],
        seoImageUrl: row.seo_image_url ?? `${row.portal_base_url.replace(/\/$/, "")}/assets/talkaris-social-card.svg`,
        organizationName: row.organization_name ?? row.brand_name,
        contactEmail: row.contact_email ?? row.support_email,
        heroPoints: Array.isArray(row.hero_points) ? row.hero_points.filter((value) => typeof value === "string") : [],
        featureFlags: typeof row.feature_flags === "object" && row.feature_flags ? row.feature_flags : {},
    };
}
function normalizeBlogPost(row) {
    return {
        id: row.id,
        slug: row.slug,
        locale: row.locale === "es" ? "es" : "en",
        title: row.title,
        summary: row.summary,
        bodyHtml: row.body_html,
        imageUrl: row.image_url ?? null,
        tags: Array.isArray(row.tags) ? row.tags.filter((value) => typeof value === "string") : [],
        author: row.author,
        category: row.category ?? null,
        status: row.status === "publish" ? "publish" : "draft",
        seoTitle: row.seo_title ?? null,
        seoDescription: row.seo_description ?? null,
        publishedAt: row.published_at ? new Date(row.published_at).toISOString() : null,
        createdAt: new Date(row.created_at).toISOString(),
        updatedAt: new Date(row.updated_at).toISOString(),
    };
}
async function loadPortalUserById(userId) {
    const userResult = await pool.query(`SELECT id, email, display_name, platform_role, status
     FROM users
     WHERE id = $1
     LIMIT 1`, [userId]);
    if (!userResult.rowCount) {
        return null;
    }
    const membershipsResult = await pool.query(`SELECT tm.id, tm.tenant_id, tm.user_id, tm.role, t.name AS tenant_name, t.slug AS tenant_slug
     FROM tenant_memberships tm
     INNER JOIN tenants t ON t.id = tm.tenant_id
     WHERE tm.user_id = $1
     ORDER BY t.name ASC`, [userId]);
    const row = userResult.rows[0];
    return {
        id: row.id,
        email: row.email,
        displayName: row.display_name ?? null,
        platformRole: row.platform_role,
        status: row.status,
        memberships: membershipsResult.rows.map(normalizeMembership),
    };
}
async function getProjectBySiteKey(siteKey) {
    const result = await pool.query("SELECT * FROM projects WHERE site_key = $1 LIMIT 1", [siteKey]);
    return result.rowCount ? normalizeProject(result.rows[0]) : null;
}
async function getProjectByKey(projectKey) {
    const result = await pool.query("SELECT * FROM projects WHERE project_key = $1 LIMIT 1", [projectKey]);
    return result.rowCount ? normalizeProject(result.rows[0]) : null;
}
async function getProjectForTenant(tenantId, projectKey) {
    const result = await pool.query("SELECT * FROM projects WHERE tenant_id = $1 AND project_key = $2 LIMIT 1", [tenantId, projectKey]);
    return result.rowCount ? normalizeProject(result.rows[0]) : null;
}
async function getSource(projectId, sourceKey) {
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
async function getTenantById(tenantId) {
    const result = await pool.query("SELECT * FROM tenants WHERE id = $1 LIMIT 1", [tenantId]);
    return result.rowCount ? normalizeTenant(result.rows[0]) : null;
}
async function getTenantBySlug(slug) {
    const result = await pool.query("SELECT * FROM tenants WHERE slug = $1 LIMIT 1", [slug]);
    return result.rowCount ? normalizeTenant(result.rows[0]) : null;
}
async function getPlatformSettings() {
    const result = await pool.query("SELECT * FROM platform_settings WHERE id = 'default' LIMIT 1");
    if (!result.rowCount) {
        throw new Error("Platform settings not configured");
    }
    return normalizePlatformSettings(result.rows[0]);
}
async function getUserByEmail(email) {
    const result = await pool.query(`SELECT id, email, password_hash, display_name, platform_role, status
     FROM users
     WHERE LOWER(email) = LOWER($1)
     LIMIT 1`, [email]);
    return result.rows[0] ?? null;
}
function hasOpsBearer(req) {
    const header = req.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    return token === env.ADMIN_BEARER_TOKEN;
}
function hasPublisherBearer(req) {
    const header = req.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    if (!token) {
        return false;
    }
    if (env.AUCTORIO_PUBLISHER_TOKEN) {
        return token === env.AUCTORIO_PUBLISHER_TOKEN;
    }
    return token === env.ADMIN_BEARER_TOKEN;
}
function getCookieOptions() {
    return {
        httpOnly: true,
        sameSite: "lax",
        secure: env.NODE_ENV === "production",
        path: "/",
    };
}
function getRouteParam(req, key) {
    const value = req.params[key];
    return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
function signSessionToken(user) {
    const claims = {
        sub: user.id,
        email: user.email,
        platformRole: user.platformRole,
    };
    return jwt.sign(claims, env.JWT_SECRET, { expiresIn: `${env.SESSION_TTL_HOURS}h` });
}
function verifySessionToken(token) {
    return jwt.verify(token, env.JWT_SECRET);
}
function setSessionCookie(res, user) {
    res.cookie(env.COOKIE_NAME, signSessionToken(user), getCookieOptions());
}
function clearSessionCookie(res) {
    res.clearCookie(env.COOKIE_NAME, getCookieOptions());
}
async function authenticateCookieUser(req, res) {
    const token = req.cookies?.[env.COOKIE_NAME];
    if (!token) {
        res.status(401).json({ code: "UNAUTHENTICATED", message: "Missing session" });
        return null;
    }
    try {
        const claims = verifySessionToken(token);
        const user = await loadPortalUserById(claims.sub);
        if (!user || user.status !== "active") {
            clearSessionCookie(res);
            res.status(401).json({ code: "UNAUTHENTICATED", message: "Invalid session" });
            return null;
        }
        req.user = user;
        return user;
    }
    catch {
        clearSessionCookie(res);
        res.status(401).json({ code: "UNAUTHENTICATED", message: "Invalid session" });
        return null;
    }
}
const requirePortalAuth = asyncHandler(async (req, res, next) => {
    const user = await authenticateCookieUser(req, res);
    if (!user) {
        return;
    }
    next();
});
const requireOpsOrSuperadmin = asyncHandler(async (req, res, next) => {
    const portalReq = req;
    if (hasOpsBearer(req)) {
        portalReq.opsAuthorized = true;
        next();
        return;
    }
    const user = await authenticateCookieUser(portalReq, res);
    if (!user) {
        return;
    }
    if (user.platformRole !== "superadmin") {
        res.status(403).json({ code: "FORBIDDEN", message: "Superadmin required" });
        return;
    }
    next();
});
const requirePublisherOps = asyncHandler(async (req, res, next) => {
    if (!hasPublisherBearer(req)) {
        res.status(401).json({ code: "UNAUTHENTICATED", message: "Publisher token required" });
        return;
    }
    next();
});
function authorizeTenant(allowedRoles) {
    return asyncHandler(async (req, res, next) => {
        const portalReq = req;
        const user = await authenticateCookieUser(portalReq, res);
        if (!user) {
            return;
        }
        const tenantId = getRouteParam(req, "tenantId");
        const tenant = await getTenantById(tenantId);
        if (!tenant) {
            res.status(404).json({ code: "NOT_FOUND", message: "Tenant not found" });
            return;
        }
        portalReq.tenant = tenant;
        if (user.platformRole === "superadmin") {
            next();
            return;
        }
        const membership = user.memberships.find((item) => item.tenantId === tenantId);
        if (!membership || !allowedRoles.includes(membership.role)) {
            res.status(403).json({ code: "FORBIDDEN", message: "Tenant access denied" });
            return;
        }
        portalReq.tenantMembership = membership;
        next();
    });
}
const requireTenantRead = authorizeTenant(["admin", "editor", "viewer"]);
const requireTenantWrite = authorizeTenant(["admin", "editor"]);
async function logAnalytics(projectId, conversationId, eventType, payload) {
    await pool.query(`INSERT INTO analytics_events (project_id, conversation_id, event_type, payload)
     VALUES ($1, $2, $3, $4::jsonb)`, [projectId, conversationId, eventType, JSON.stringify(payload)]);
}
function summarizeText(body) {
    const cleaned = body.replace(/\s+/g, " ").trim();
    const sentences = cleaned.match(/[^.!?]+[.!?]?/g) ?? [cleaned];
    return sentences.slice(0, 2).join(" ").trim();
}
async function queueTalkarisBlogReingestion(requestedBy) {
    const project = await getProjectByKey(env.BLOG_REINGEST_PROJECT_KEY);
    if (!project) {
        return;
    }
    const settings = await getPlatformSettings();
    const entryUrl = `${settings.portalBaseUrl.replace(/\/$/, "")}/sitemap.xml`;
    const allowedDomain = new URL(settings.portalBaseUrl).hostname;
    const sourceResult = await pool.query(`INSERT INTO sources (
       project_id, source_key, kind, entry_url, include_patterns, exclude_patterns, allowed_domains, visibility, default_category
     )
     VALUES ($1, $2, 'sitemap', $3, '{}', '{}', $4, 'public', 'blog')
     ON CONFLICT (project_id, source_key)
     DO UPDATE SET
       kind = EXCLUDED.kind,
       entry_url = EXCLUDED.entry_url,
       allowed_domains = EXCLUDED.allowed_domains,
       visibility = EXCLUDED.visibility,
       default_category = EXCLUDED.default_category,
       updated_at = NOW()
     RETURNING id`, [project.id, env.BLOG_REINGEST_SOURCE_KEY, entryUrl, [allowedDomain]]);
    const sourceId = sourceResult.rows[0]?.id;
    if (!sourceId) {
        return;
    }
    await pool.query(`INSERT INTO ingestion_jobs (project_id, source_id, status, requested_by)
     VALUES ($1, $2, 'queued', $3)`, [project.id, sourceId, requestedBy]);
}
export function buildLooseTsQuery(userMessage) {
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
export function slugify(value) {
    const slug = value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .replace(/-{2,}/g, "-");
    return slug || `tenant-${randomUUID().slice(0, 8)}`;
}
function hashOpaqueToken(token) {
    return createHash("sha256").update(token).digest("hex");
}
const answerI18n = {
    es: { found: "He encontrado informaci\u00f3n relevante.", cta: "Puedo orientarte al siguiente paso." },
    en: { found: "I found relevant information.", cta: "I can guide you to the next step." },
    fr: { found: "J\u2019ai trouv\u00e9 des informations pertinentes.", cta: "Je peux vous orienter vers la prochaine \u00e9tape." },
    pt: { found: "Encontrei informa\u00e7\u00f5es relevantes.", cta: "Posso orient\u00e1-lo para o pr\u00f3ximo passo." },
    de: { found: "Ich habe relevante Informationen gefunden.", cta: "Ich kann Sie zum n\u00e4chsten Schritt f\u00fchren." },
    ca: { found: "He trobat informaci\u00f3 rellevant.", cta: "Puc orientar-te al proper pas." },
    it: { found: "Ho trovato informazioni rilevanti.", cta: "Posso guidarti al passo successivo." },
};
function composeAnswer(project, userMessage, chunks, lang) {
    if (!chunks.length || Number(chunks[0].score) < 0.005) {
        return buildFallbackAnswer(project);
    }
    const t = answerI18n[(lang ?? project.language ?? "es").slice(0, 2)] ?? answerI18n["es"];
    const topChunks = selectTopChunks(chunks.map((chunk) => ({ ...chunk, score: Number(chunk.score) })), 4);
    const uniqueParagraphs = [];
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
        uniqueParagraphs[0] ?? t.found,
        uniqueParagraphs.slice(1).join(" "),
        commercialIntent > 0 ? t.cta : "",
    ]
        .filter(Boolean)
        .join("\n\n");
    const citations = topChunks.slice(0, 3).map((chunk) => ({
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
async function callLlm(project, userMessage, chunks, lang) {
    const cfg = project.aiConfig;
    if (!cfg?.provider || !cfg?.model)
        return null;
    const context = chunks.slice(0, 4).map(c => `[${c.title}]\n${c.body}`).join("\n\n---\n\n");
    const systemPrompt = [
        `Eres un asistente de soporte. Responde siempre en el idioma: ${lang}.`,
        `Usa únicamente la información del contexto proporcionado. Si no encuentras la respuesta en el contexto, indícalo claramente.`,
        cfg.systemPromptAdditions ?? "",
    ].filter(Boolean).join("\n");
    if (cfg.provider === "openai") {
        if (!env.OPENAI_API_KEY)
            return null;
        const { OpenAI } = await import("openai");
        const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
        const resp = await client.chat.completions.create({
            model: cfg.model,
            temperature: cfg.temperature ?? 0.3,
            max_tokens: cfg.maxTokens ?? 512,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Contexto:\n${context}\n\nPregunta: ${userMessage}` },
            ],
        });
        return resp.choices[0]?.message?.content ?? null;
    }
    if (cfg.provider === "anthropic") {
        if (!env.ANTHROPIC_API_KEY)
            return null;
        const { default: Anthropic } = await import("@anthropic-ai/sdk");
        const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
        const resp = await client.messages.create({
            model: cfg.model,
            max_tokens: cfg.maxTokens ?? 512,
            system: systemPrompt,
            messages: [{ role: "user", content: `Contexto:\n${context}\n\nPregunta: ${userMessage}` }],
        });
        return resp.content[0].text ?? null;
    }
    if (cfg.provider === "deepseek") {
        if (!env.DEEPSEEK_API_KEY)
            return null;
        const { OpenAI } = await import("openai");
        const client = new OpenAI({
            apiKey: env.DEEPSEEK_API_KEY,
            baseURL: "https://api.deepseek.com",
        });
        const resp = await client.chat.completions.create({
            model: cfg.model,
            temperature: cfg.temperature ?? 0.3,
            max_tokens: cfg.maxTokens ?? 512,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Contexto:\n${context}\n\nPregunta: ${userMessage}` },
            ],
        });
        return resp.choices[0]?.message?.content ?? null;
    }
    if (cfg.provider === "google") {
        if (!env.GOOGLE_AI_API_KEY)
            return null;
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(env.GOOGLE_AI_API_KEY);
        const gemini = genAI.getGenerativeModel({ model: cfg.model });
        const prompt = `${systemPrompt}\n\nContexto:\n${context}\n\nPregunta: ${userMessage}`;
        const result = await gemini.generateContent(prompt);
        return result.response.text() ?? null;
    }
    return null;
}
async function retrieveChunks(projectId, userMessage) {
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
    const looseTsQuery = buildLooseTsQuery(userMessage);
    if (looseTsQuery) {
        const looseResult = await pool.query(`
        SELECT
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
        LIMIT 8
      `, [projectId, looseTsQuery]);
        if (looseResult.rowCount) {
            return looseResult.rows;
        }
    }
    const fallback = await pool.query(`
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
    `, [projectId, `%${userMessage}%`]);
    return fallback.rows;
}
async function deliverLead(project, payload) {
    const sink = project.leadSink;
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
    }
    catch (error) {
        return {
            status: "failed",
            response: {
                error: error instanceof Error ? error.message : "unknown error",
            },
        };
    }
}
async function sendMail(to, subject, text) {
    if (!mailTransport) {
        console.warn(`[chat-api] SMTP not configured; skipped email to ${to}: ${subject}`);
        return;
    }
    await mailTransport.sendMail({
        from: env.SMTP_FROM,
        to,
        subject,
        text,
    });
}
async function issuePasswordResetToken(userId) {
    const rawToken = randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_TTL_MINUTES * 60_000);
    await pool.query(`INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`, [userId, hashOpaqueToken(rawToken), expiresAt.toISOString()]);
    return { rawToken, expiresAt };
}
async function resolveProjectTenant(payload) {
    if (payload.tenantId) {
        return getTenantById(payload.tenantId);
    }
    if (payload.tenantSlug) {
        return getTenantBySlug(payload.tenantSlug);
    }
    return getTenantBySlug("platform-default");
}
async function upsertProjectForTenant(payload, tenantId) {
    const siteKey = payload.siteKey ?? randomUUID();
    const result = await pool.query(`INSERT INTO projects (
       tenant_id,
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
       lead_sink,
       status,
       public_base_url,
       metadata,
       language_mode
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11::jsonb, $12::jsonb, $13, $14, $15::jsonb, $16)
     ON CONFLICT (project_key)
     DO UPDATE SET
       tenant_id = EXCLUDED.tenant_id,
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
       status = EXCLUDED.status,
       public_base_url = EXCLUDED.public_base_url,
       metadata = EXCLUDED.metadata,
       language_mode = EXCLUDED.language_mode,
       updated_at = NOW()
     RETURNING *`, [
        tenantId,
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
        JSON.stringify(payload.leadSink ?? {
            mode: "webhook",
            webhookUrl: env.DEFAULT_LEAD_WEBHOOK_URL,
            secretHeaderName: "x-talkaris-chat-secret",
        }),
        payload.status,
        payload.publicBaseUrl ?? null,
        JSON.stringify(payload.metadata ?? {}),
        payload.languageMode ?? "fixed",
    ]);
    return normalizeProject(result.rows[0]);
}
async function buildAnalyticsSummary(projectId, projectKey) {
    const events = await pool.query(`SELECT event_type AS "eventType", COUNT(*)::int AS total
     FROM analytics_events
     WHERE project_id = $1
     GROUP BY event_type
     ORDER BY total DESC`, [projectId]);
    const unanswered = await pool.query(`SELECT payload->>'message' AS message, COUNT(*)::int AS total
     FROM analytics_events
     WHERE project_id = $1
       AND event_type = 'no_answer'
     GROUP BY payload->>'message'
     ORDER BY total DESC
     LIMIT 10`, [projectId]);
    const leads = await pool.query(`SELECT delivery_status AS "deliveryStatus", COUNT(*)::int AS total
     FROM lead_events
     WHERE project_id = $1
     GROUP BY delivery_status`, [projectId]);
    return {
        projectKey,
        events: events.rows,
        unanswered: unanswered.rows,
        leads: leads.rows,
    };
}
export function buildWidgetSnippet(settings, project) {
    const widgetBase = settings.widgetBaseUrl.endsWith("/") ? settings.widgetBaseUrl : `${settings.widgetBaseUrl}/`;
    return `<script>
  window.TalkarisWidgetConfig = {
    siteKey: "${project.siteKey}",
    apiBase: "${settings.apiBaseUrl}",
    widgetBaseUrl: "${widgetBase}"
  };
</script>
<script async src="${new URL("embed.js", widgetBase).toString()}"></script>`;
}
function isOriginAllowed(project, origin) {
    if (!origin || project.allowedDomains.length === 0) {
        return true;
    }
    try {
        const host = new URL(origin).hostname;
        if (env.NODE_ENV !== "production" && (host === "localhost" || host === "127.0.0.1")) {
            return true;
        }
        return project.allowedDomains.some((domain) => host === domain || host.endsWith(`.${domain}`));
    }
    catch {
        return false;
    }
}
app.get("/health", asyncHandler(async (_req, res) => {
    const dbNow = await pool.query("SELECT NOW() AS now");
    res.json({ ok: true, service: "chat-api", db: dbNow.rows[0].now });
}));
app.get("/v1/public/platform", asyncHandler(async (_req, res) => {
    const settings = await getPlatformSettings();
    const demoProject = await getProjectByKey(settings.demoProjectKey);
    res.json({
        platform: settings,
        demo: demoProject
            ? {
                projectKey: demoProject.projectKey,
                siteKey: demoProject.siteKey,
                botName: demoProject.botName,
                welcomeMessage: demoProject.welcomeMessage,
            }
            : {
                projectKey: settings.demoProjectKey,
                siteKey: settings.demoSiteKey,
            },
    });
}));
app.get("/v1/public/blog", asyncHandler(async (req, res) => {
    const locale = String(req.query.locale ?? "").trim().toLowerCase();
    const limit = Math.min(Math.max(Number.parseInt(String(req.query.limit ?? "24"), 10) || 24, 1), 100);
    const settings = await getPlatformSettings();
    const values = [limit];
    let localeFilter = "";
    if (locale === "es" || locale === "en") {
        values.unshift(locale);
        localeFilter = "AND locale = $1";
    }
    const limitPlaceholder = localeFilter ? "$2" : "$1";
    const result = await pool.query(`SELECT *
     FROM blog_posts
     WHERE status = 'publish'
       ${localeFilter}
     ORDER BY COALESCE(published_at, created_at) DESC, created_at DESC
     LIMIT ${limitPlaceholder}`, values);
    const items = result.rows.map((row) => {
        const post = normalizeBlogPost(row);
        return {
            ...post,
            publicUrl: `${settings.portalBaseUrl.replace(/\/$/, "")}${post.locale === "en" ? "/en" : ""}/blog/${post.slug}`,
        };
    });
    res.json({ items });
}));
app.get("/v1/public/blog/:slug", asyncHandler(async (req, res) => {
    const settings = await getPlatformSettings();
    const result = await pool.query(`SELECT *
     FROM blog_posts
     WHERE slug = $1
       AND status = 'publish'
     LIMIT 1`, [getRouteParam(req, "slug")]);
    if (!result.rowCount) {
        res.status(404).json({ code: "NOT_FOUND", message: "Blog post not found" });
        return;
    }
    const post = normalizeBlogPost(result.rows[0]);
    res.json({
        ...post,
        publicUrl: `${settings.portalBaseUrl.replace(/\/$/, "")}${post.locale === "en" ? "/en" : ""}/blog/${post.slug}`,
    });
}));
app.post("/v1/public/access-requests", rateLimitByIp("public-access-request", 5, 15 * 60 * 1000), asyncHandler(async (req, res) => {
    const parsed = accessRequestSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ code: "INVALID_INPUT", issues: parsed.error.flatten() });
        return;
    }
    const payload = parsed.data;
    if (!isAllowedPublicEmail(payload.email)) {
        res.status(400).json({ code: "INVALID_EMAIL_DOMAIN", message: "Use a real business email address." });
        return;
    }
    const result = await pool.query(`INSERT INTO access_requests (name, company, email, phone, message, requested_tenant_name)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, status, created_at AS "createdAt"`, [
        payload.name,
        payload.company,
        payload.email,
        payload.phone ?? null,
        payload.message ?? null,
        payload.requestedTenantName ?? payload.company,
    ]);
    res.status(202).json(result.rows[0]);
}));
app.post("/v1/ops/blog", requirePublisherOps, asyncHandler(async (req, res) => {
    const parsed = blogUpsertSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ code: "INVALID_INPUT", issues: parsed.error.flatten() });
        return;
    }
    const body = parsed.data;
    const result = await pool.query(`INSERT INTO blog_posts (
       slug, locale, title, summary, body_html, image_url, tags, author, category, status, seo_title, seo_description, published_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12, $13)
     RETURNING *`, [
        body.slug,
        body.locale,
        body.title,
        body.summary,
        body.bodyHtml,
        body.imageUrl ?? null,
        JSON.stringify(body.tags),
        body.author,
        body.category ?? null,
        body.status,
        body.seoTitle ?? null,
        body.seoDescription ?? null,
        body.status === "publish" ? body.publishedAt ?? new Date().toISOString() : null,
    ]);
    await queueTalkarisBlogReingestion("auctorio_publish");
    res.status(201).json(normalizeBlogPost(result.rows[0]));
}));
app.put("/v1/ops/blog/:id", requirePublisherOps, asyncHandler(async (req, res) => {
    const parsed = blogUpsertSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ code: "INVALID_INPUT", issues: parsed.error.flatten() });
        return;
    }
    const body = parsed.data;
    const result = await pool.query(`UPDATE blog_posts
     SET slug = $1,
         locale = $2,
         title = $3,
         summary = $4,
         body_html = $5,
         image_url = $6,
         tags = $7::jsonb,
         author = $8,
         category = $9,
         status = $10,
         seo_title = $11,
         seo_description = $12,
         published_at = CASE
           WHEN $10 = 'publish' THEN COALESCE($13::timestamptz, published_at, NOW())
           ELSE NULL
         END,
         updated_at = NOW()
     WHERE id = $14
     RETURNING *`, [
        body.slug,
        body.locale,
        body.title,
        body.summary,
        body.bodyHtml,
        body.imageUrl ?? null,
        JSON.stringify(body.tags),
        body.author,
        body.category ?? null,
        body.status,
        body.seoTitle ?? null,
        body.seoDescription ?? null,
        body.publishedAt ?? null,
        getRouteParam(req, "id"),
    ]);
    if (!result.rowCount) {
        res.status(404).json({ code: "NOT_FOUND", message: "Blog post not found" });
        return;
    }
    await queueTalkarisBlogReingestion("auctorio_update");
    res.json(normalizeBlogPost(result.rows[0]));
}));
app.delete("/v1/ops/blog/:id", requirePublisherOps, asyncHandler(async (req, res) => {
    const result = await pool.query("DELETE FROM blog_posts WHERE id = $1 RETURNING id", [getRouteParam(req, "id")]);
    if (!result.rowCount) {
        res.status(404).json({ code: "NOT_FOUND", message: "Blog post not found" });
        return;
    }
    await queueTalkarisBlogReingestion("auctorio_delete");
    res.status(204).send();
}));
app.post("/v1/auth/login", rateLimitByIp("auth-login", 10, 15 * 60 * 1000), asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ code: "INVALID_INPUT", issues: parsed.error.flatten() });
        return;
    }
    const userRow = await getUserByEmail(parsed.data.email);
    if (!userRow || !userRow.password_hash || userRow.status !== "active") {
        res.status(401).json({ code: "INVALID_CREDENTIALS", message: "Invalid credentials" });
        return;
    }
    const matches = await bcrypt.compare(parsed.data.password, userRow.password_hash);
    if (!matches) {
        res.status(401).json({ code: "INVALID_CREDENTIALS", message: "Invalid credentials" });
        return;
    }
    await pool.query("UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1", [userRow.id]);
    const user = await loadPortalUserById(userRow.id);
    if (!user) {
        res.status(500).json({ code: "INTERNAL_ERROR", message: "User could not be loaded" });
        return;
    }
    setSessionCookie(res, user);
    res.json(user);
}));
app.post("/v1/auth/logout", asyncHandler(async (_req, res) => {
    clearSessionCookie(res);
    res.status(204).end();
}));
app.get("/v1/auth/me", requirePortalAuth, asyncHandler(async (req, res) => {
    res.json(req.user);
}));
app.post("/v1/auth/password/request-reset", rateLimitByIp("auth-request-reset", 5, 15 * 60 * 1000), asyncHandler(async (req, res) => {
    const parsed = passwordRequestSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ code: "INVALID_INPUT", issues: parsed.error.flatten() });
        return;
    }
    const userRow = await getUserByEmail(parsed.data.email);
    let resetToken = null;
    if (userRow) {
        const issued = await issuePasswordResetToken(userRow.id);
        resetToken = issued.rawToken;
        const resetUrl = new URL("/reset-password", env.PORTAL_PUBLIC_URL);
        resetUrl.searchParams.set("token", issued.rawToken);
        await sendMail(userRow.email, "Restablecer acceso al portal", `Se ha solicitado restablecer tu acceso. Usa este enlace: ${resetUrl.toString()}`);
    }
    res.status(202).json({
        ok: true,
        resetToken: env.NODE_ENV === "production" ? undefined : resetToken,
    });
}));
app.post("/v1/auth/password/reset", rateLimitByIp("auth-reset-password", 10, 15 * 60 * 1000), asyncHandler(async (req, res) => {
    const parsed = passwordResetSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ code: "INVALID_INPUT", issues: parsed.error.flatten() });
        return;
    }
    const tokenHash = hashOpaqueToken(parsed.data.token);
    const tokenResult = await pool.query(`SELECT user_id
     FROM password_reset_tokens
     WHERE token_hash = $1
       AND used_at IS NULL
       AND expires_at > NOW()
     LIMIT 1`, [tokenHash]);
    if (!tokenResult.rowCount) {
        res.status(400).json({ code: "INVALID_TOKEN", message: "Reset token is invalid or expired" });
        return;
    }
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const userId = tokenResult.rows[0].user_id;
    await pool.query(`UPDATE users
     SET password_hash = $1,
         status = 'active',
         email_verified_at = COALESCE(email_verified_at, NOW()),
         updated_at = NOW()
     WHERE id = $2`, [passwordHash, userId]);
    await pool.query(`UPDATE password_reset_tokens
     SET used_at = NOW()
     WHERE token_hash = $1`, [tokenHash]);
    const user = await loadPortalUserById(userId);
    if (!user) {
        res.status(500).json({ code: "INTERNAL_ERROR", message: "User could not be loaded" });
        return;
    }
    setSessionCookie(res, user);
    res.json(user);
}));
app.get("/v1/widget/config/:siteKey", asyncHandler(async (req, res) => {
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
        theme: project.widgetTheme,
        cta: project.ctaConfig,
        promptPolicy: {
            tone: project.promptPolicy.tone,
            outOfScopeMessage: project.promptPolicy.outOfScopeMessage,
        },
        enableHandover: project.enableHandover ?? false,
    });
}));
app.post("/v1/widget/sessions", asyncHandler(async (req, res) => {
    const parsed = sessionSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ code: "INVALID_INPUT", issues: parsed.error.flatten() });
        return;
    }
    const project = await getProjectBySiteKey(parsed.data.siteKey);
    if (!project || project.status !== "active" || !isOriginAllowed(project, parsed.data.origin)) {
        res.status(403).json({ code: "FORBIDDEN", message: "Origin not allowed" });
        return;
    }
    const insert = await pool.query(`INSERT INTO conversations (project_id, site_key, origin, user_agent, detected_language)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`, [project.id, project.siteKey, parsed.data.origin ?? null, req.headers["user-agent"] ?? null, parsed.data.detectedLanguage ?? null]);
    await logAnalytics(project.id, insert.rows[0].id, "widget_opened", {
        origin: parsed.data.origin ?? null,
    });
    res.status(201).json({
        conversationId: insert.rows[0].id,
        botName: project.botName,
        welcomeMessage: project.welcomeMessage,
    });
}));
app.post("/v1/widget/messages", asyncHandler(async (req, res) => {
    const parsed = messageSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ code: "INVALID_INPUT", issues: parsed.error.flatten() });
        return;
    }
    const conversation = await pool.query(`SELECT c.id, c.project_id, c.detected_language, p.*
     FROM conversations c
     INNER JOIN projects p ON p.id = c.project_id
     WHERE c.id = $1
     LIMIT 1`, [parsed.data.conversationId]);
    if (!conversation.rowCount) {
        res.status(404).json({ code: "NOT_FOUND", message: "Conversation not found" });
        return;
    }
    const project = normalizeProject(conversation.rows[0]);
    if (project.status !== "active") {
        res.status(403).json({ code: "FORBIDDEN", message: "Project disabled" });
        return;
    }
    await pool.query(`INSERT INTO messages (conversation_id, project_id, role, body)
     VALUES ($1, $2, 'user', $3)`, [parsed.data.conversationId, project.id, parsed.data.message]);
    await logAnalytics(project.id, parsed.data.conversationId, "message_sent", { message: parsed.data.message });
    const convLang = project.languageMode === "auto"
        ? (conversation.rows[0].detected_language ?? project.language)
        : project.language;
    const chunks = await retrieveChunks(project.id, parsed.data.message);
    let answer;
    const llmText = await callLlm(project, parsed.data.message, chunks, convLang).catch(() => null);
    if (llmText) {
        const citations = chunks.slice(0, 3).map((c) => ({
            title: c.title,
            url: c.canonicalUrl,
            snippet: c.body.slice(0, 120),
        }));
        answer = { message: llmText, citations, cta: undefined, confidence: 0.9, usedFallback: false };
    }
    else {
        answer = composeAnswer(project, parsed.data.message, chunks, convLang);
    }
    await pool.query(`INSERT INTO messages (conversation_id, project_id, role, body, citations, confidence)
     VALUES ($1, $2, 'assistant', $3, $4::jsonb, $5)`, [parsed.data.conversationId, project.id, answer.message, JSON.stringify(answer.citations), answer.confidence]);
    await logAnalytics(project.id, parsed.data.conversationId, answer.usedFallback ? "fallback" : "response_served", {
        confidence: answer.confidence,
        citations: answer.citations.map((item) => item.url),
    });
    if (answer.usedFallback) {
        await logAnalytics(project.id, parsed.data.conversationId, "no_answer", { message: parsed.data.message });
    }
    res.setHeader("content-type", "text/event-stream; charset=utf-8");
    res.setHeader("cache-control", "no-cache, no-transform");
    res.setHeader("connection", "keep-alive");
    res.write(`data: ${JSON.stringify({ type: "answer", payload: answer })}\n\n`);
    res.end();
}));
app.post("/v1/widget/leads", asyncHandler(async (req, res) => {
    const parsed = leadSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ code: "INVALID_INPUT", issues: parsed.error.flatten() });
        return;
    }
    const conversation = await pool.query(`SELECT c.id, c.project_id, p.*
     FROM conversations c
     INNER JOIN projects p ON p.id = c.project_id
     WHERE c.id = $1
     LIMIT 1`, [parsed.data.conversationId]);
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
    const insert = await pool.query(`INSERT INTO lead_events (project_id, conversation_id, payload, delivery_status, delivery_response)
     VALUES ($1, $2, $3::jsonb, $4, $5::jsonb)
     RETURNING id`, [project.id, parsed.data.conversationId, JSON.stringify(payload), delivery.status, JSON.stringify(delivery.response)]);
    await logAnalytics(project.id, parsed.data.conversationId, "lead_submitted", {
        leadEventId: insert.rows[0].id,
        deliveryStatus: delivery.status,
    });
    res.status(202).json({ leadEventId: insert.rows[0].id, deliveryStatus: delivery.status });
}));
app.post("/v1/widget/events", asyncHandler(async (req, res) => {
    const parsed = eventSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ code: "INVALID_INPUT", issues: parsed.error.flatten() });
        return;
    }
    const conversation = await pool.query(`SELECT project_id FROM conversations WHERE id = $1 LIMIT 1`, [parsed.data.conversationId]);
    if (!conversation.rowCount) {
        res.status(404).json({ code: "NOT_FOUND", message: "Conversation not found" });
        return;
    }
    await logAnalytics(conversation.rows[0].project_id, parsed.data.conversationId, parsed.data.eventType, parsed.data.payload);
    res.status(202).json({ ok: true });
}));
app.post("/v1/integrations/webhooks/leads", asyncHandler(async (req, res) => {
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
}));
app.get("/v1/portal/tenants", requirePortalAuth, asyncHandler(async (req, res) => {
    const user = req.user;
    if (user.platformRole === "superadmin") {
        const tenants = await pool.query("SELECT * FROM tenants ORDER BY name ASC");
        res.json(tenants.rows.map(normalizeTenant));
        return;
    }
    const tenants = await pool.query(`SELECT t.*
     FROM tenant_memberships tm
     INNER JOIN tenants t ON t.id = tm.tenant_id
     WHERE tm.user_id = $1
     ORDER BY t.name ASC`, [user.id]);
    res.json(tenants.rows.map(normalizeTenant));
}));
app.get("/v1/portal/tenants/:tenantId/overview", requireTenantRead, asyncHandler(async (req, res) => {
    const tenantId = req.params.tenantId;
    const stats = await pool.query(`SELECT
       (SELECT COUNT(*)::int FROM projects WHERE tenant_id = $1) AS projects,
       (SELECT COUNT(*)::int FROM sources s INNER JOIN projects p ON p.id = s.project_id WHERE p.tenant_id = $1) AS sources,
       (SELECT COUNT(*)::int FROM ingestion_jobs ij INNER JOIN projects p ON p.id = ij.project_id WHERE p.tenant_id = $1 AND ij.status IN ('queued', 'running')) AS active_ingestions,
       (SELECT COUNT(*)::int FROM documents d INNER JOIN projects p ON p.id = d.project_id WHERE p.tenant_id = $1) AS documents,
       (SELECT COUNT(*)::int FROM lead_events le INNER JOIN projects p ON p.id = le.project_id WHERE p.tenant_id = $1) AS leads,
       (SELECT COUNT(*)::int FROM conversations c INNER JOIN projects p ON p.id = c.project_id WHERE p.tenant_id = $1) AS conversations,
       (SELECT COUNT(*)::int FROM analytics_events ae INNER JOIN projects p ON p.id = ae.project_id WHERE p.tenant_id = $1 AND ae.event_type = 'no_answer') AS unanswered`, [tenantId]);
    const recentJobs = await pool.query(`SELECT ij.id, ij.status, ij.created_at AS "createdAt", s.source_key AS "sourceKey", p.project_key AS "projectKey"
     FROM ingestion_jobs ij
     INNER JOIN sources s ON s.id = ij.source_id
     INNER JOIN projects p ON p.id = ij.project_id
     WHERE p.tenant_id = $1
     ORDER BY ij.created_at DESC
     LIMIT 8`, [tenantId]);
    res.json({
        tenant: req.tenant,
        stats: stats.rows[0],
        recentJobs: recentJobs.rows,
    });
}));
app.get("/v1/portal/tenants/:tenantId/projects", requireTenantRead, asyncHandler(async (req, res) => {
    const result = await pool.query(`SELECT * FROM projects
     WHERE tenant_id = $1
     ORDER BY updated_at DESC, name ASC`, [req.params.tenantId]);
    res.json(result.rows.map(normalizeProject));
}));
app.post("/v1/portal/tenants/:tenantId/projects", requireTenantWrite, asyncHandler(async (req, res) => {
    const parsed = createProjectSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ code: "INVALID_INPUT", issues: parsed.error.flatten() });
        return;
    }
    const tenantId = getRouteParam(req, "tenantId");
    const project = await upsertProjectForTenant({ ...parsed.data, tenantId }, tenantId);
    res.status(201).json(project);
}));
app.get("/v1/portal/tenants/:tenantId/projects/:projectKey/snippet", requireTenantRead, asyncHandler(async (req, res) => {
    const project = await getProjectForTenant(getRouteParam(req, "tenantId"), getRouteParam(req, "projectKey"));
    if (!project) {
        res.status(404).json({ code: "NOT_FOUND", message: "Project not found" });
        return;
    }
    const settings = await getPlatformSettings();
    res.json({
        siteKey: project.siteKey,
        apiBase: settings.apiBaseUrl,
        widgetBase: settings.widgetBaseUrl,
        snippet: buildWidgetSnippet(settings, project),
    });
}));
app.get("/v1/portal/tenants/:tenantId/sources", requireTenantRead, asyncHandler(async (req, res) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
        res.status(400).json({ code: "INVALID_QUERY", issues: parsed.error.flatten() });
        return;
    }
    const values = [req.params.tenantId, parsed.data.limit];
    let projectFilter = "";
    if (parsed.data.projectKey) {
        values.push(parsed.data.projectKey);
        projectFilter = "AND p.project_key = $3";
    }
    const result = await pool.query(`SELECT s.*, p.project_key AS "projectKey"
     FROM sources s
     INNER JOIN projects p ON p.id = s.project_id
     WHERE p.tenant_id = $1
       ${projectFilter}
     ORDER BY s.updated_at DESC
     LIMIT $2`, values);
    res.json(result.rows);
}));
app.post("/v1/portal/tenants/:tenantId/sources", requireTenantWrite, asyncHandler(async (req, res) => {
    const parsed = sourceSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ code: "INVALID_INPUT", issues: parsed.error.flatten() });
        return;
    }
    const project = await getProjectForTenant(getRouteParam(req, "tenantId"), parsed.data.projectKey);
    if (!project) {
        res.status(404).json({ code: "NOT_FOUND", message: "Project not found" });
        return;
    }
    const result = await pool.query(`INSERT INTO sources (
       project_id, source_key, kind, entry_url, include_patterns, exclude_patterns, allowed_domains, visibility, default_category, source_config
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
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
     RETURNING *`, [
        project.id,
        parsed.data.sourceKey,
        parsed.data.kind,
        parsed.data.entryUrl,
        parsed.data.includePatterns,
        parsed.data.excludePatterns,
        parsed.data.allowedDomains,
        parsed.data.visibility,
        parsed.data.defaultCategory ?? null,
        JSON.stringify(parsed.data.sourceConfig ?? {}),
    ]);
    res.status(201).json(result.rows[0]);
}));
app.get("/v1/portal/tenants/:tenantId/ingestions", requireTenantRead, asyncHandler(async (req, res) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
        res.status(400).json({ code: "INVALID_QUERY", issues: parsed.error.flatten() });
        return;
    }
    const values = [req.params.tenantId, parsed.data.limit];
    let projectFilter = "";
    if (parsed.data.projectKey) {
        values.push(parsed.data.projectKey);
        projectFilter = "AND p.project_key = $3";
    }
    const result = await pool.query(`SELECT
       ij.id,
       ij.status,
       ij.requested_by AS "requestedBy",
       ij.summary,
       ij.error_text AS "errorText",
       ij.created_at AS "createdAt",
       ij.started_at AS "startedAt",
       ij.finished_at AS "finishedAt",
       s.source_key AS "sourceKey",
       p.project_key AS "projectKey"
     FROM ingestion_jobs ij
     INNER JOIN sources s ON s.id = ij.source_id
     INNER JOIN projects p ON p.id = ij.project_id
     WHERE p.tenant_id = $1
       ${projectFilter}
     ORDER BY ij.created_at DESC
     LIMIT $2`, values);
    res.json(result.rows);
}));
app.post("/v1/portal/tenants/:tenantId/ingestions", requireTenantWrite, asyncHandler(async (req, res) => {
    const parsed = ingestionSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ code: "INVALID_INPUT", issues: parsed.error.flatten() });
        return;
    }
    const project = await getProjectForTenant(getRouteParam(req, "tenantId"), parsed.data.projectKey);
    if (!project) {
        res.status(404).json({ code: "NOT_FOUND", message: "Project not found" });
        return;
    }
    const source = await getSource(project.id, parsed.data.sourceKey);
    if (!source) {
        res.status(404).json({ code: "NOT_FOUND", message: "Source not found" });
        return;
    }
    const actor = req.user?.email ?? parsed.data.requestedBy ?? "portal";
    const result = await pool.query(`INSERT INTO ingestion_jobs (project_id, source_id, status, requested_by)
     VALUES ($1, $2, 'queued', $3)
     RETURNING id, status, created_at AS "createdAt"`, [project.id, source.id, actor]);
    res.status(201).json(result.rows[0]);
}));
app.get("/v1/portal/tenants/:tenantId/documents", requireTenantRead, asyncHandler(async (req, res) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
        res.status(400).json({ code: "INVALID_QUERY", issues: parsed.error.flatten() });
        return;
    }
    const values = [req.params.tenantId, parsed.data.limit];
    let projectFilter = "";
    if (parsed.data.projectKey) {
        values.push(parsed.data.projectKey);
        projectFilter = "AND p.project_key = $3";
    }
    const result = await pool.query(`SELECT
       d.id,
       d.canonical_url AS "canonicalUrl",
       d.title,
       d.doc_type AS "docType",
       d.language,
       d.category,
       d.visibility,
       d.current_version AS "currentVersion",
       d.last_ingested_at AS "lastIngestedAt",
       s.source_key AS "sourceKey",
       p.project_key AS "projectKey"
     FROM documents d
     INNER JOIN sources s ON s.id = d.source_id
     INNER JOIN projects p ON p.id = d.project_id
     WHERE p.tenant_id = $1
       ${projectFilter}
     ORDER BY d.updated_at DESC
     LIMIT $2`, values);
    res.json(result.rows);
}));
app.get("/v1/portal/tenants/:tenantId/leads", requireTenantRead, asyncHandler(async (req, res) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
        res.status(400).json({ code: "INVALID_QUERY", issues: parsed.error.flatten() });
        return;
    }
    const values = [req.params.tenantId, parsed.data.limit];
    let projectFilter = "";
    if (parsed.data.projectKey) {
        values.push(parsed.data.projectKey);
        projectFilter = "AND p.project_key = $3";
    }
    const result = await pool.query(`SELECT
       le.id,
       le.project_id AS "projectId",
       le.conversation_id AS "conversationId",
       le.delivery_status AS "deliveryStatus",
       le.payload,
       le.created_at AS "createdAt",
       p.project_key AS "projectKey"
     FROM lead_events le
     INNER JOIN projects p ON p.id = le.project_id
     WHERE p.tenant_id = $1
       ${projectFilter}
     ORDER BY le.created_at DESC
     LIMIT $2`, values);
    res.json(result.rows);
}));
app.get("/v1/portal/tenants/:tenantId/conversations", requireTenantRead, asyncHandler(async (req, res) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
        res.status(400).json({ code: "INVALID_QUERY", issues: parsed.error.flatten() });
        return;
    }
    const values = [req.params.tenantId, parsed.data.limit];
    let projectFilter = "";
    if (parsed.data.projectKey) {
        values.push(parsed.data.projectKey);
        projectFilter = "AND p.project_key = $3";
    }
    const result = await pool.query(`SELECT
       c.id,
       c.project_id AS "projectId",
       c.origin,
       c.user_agent AS "userAgent",
       c.created_at AS "createdAt",
       COUNT(m.id)::int AS "messageCount",
       MAX(m.created_at) AS "lastMessageAt",
       p.project_key AS "projectKey"
     FROM conversations c
     INNER JOIN projects p ON p.id = c.project_id
     LEFT JOIN messages m ON m.conversation_id = c.id
     WHERE p.tenant_id = $1
       ${projectFilter}
     GROUP BY c.id, p.project_key
     ORDER BY c.created_at DESC
     LIMIT $2`, values);
    res.json(result.rows);
}));
app.get("/v1/portal/tenants/:tenantId/conversations/:conversationId/messages", requireTenantRead, asyncHandler(async (req, res) => {
    const ownership = await pool.query(`SELECT c.id
     FROM conversations c
     INNER JOIN projects p ON p.id = c.project_id
     WHERE c.id = $1 AND p.tenant_id = $2
     LIMIT 1`, [req.params.conversationId, req.params.tenantId]);
    if (!ownership.rowCount) {
        res.status(404).json({ code: "NOT_FOUND", message: "Conversation not found" });
        return;
    }
    const messages = await pool.query(`SELECT id, role, body, citations, confidence, created_at AS "createdAt"
     FROM messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC`, [req.params.conversationId]);
    res.json(messages.rows);
}));
app.get("/v1/portal/tenants/:tenantId/analytics/summary", requireTenantRead, asyncHandler(async (req, res) => {
    const projectKey = String(req.query.projectKey ?? "");
    if (!projectKey) {
        res.status(400).json({ code: "INVALID_QUERY", message: "projectKey is required" });
        return;
    }
    const project = await getProjectForTenant(getRouteParam(req, "tenantId"), projectKey);
    if (!project) {
        res.status(404).json({ code: "NOT_FOUND", message: "Project not found" });
        return;
    }
    res.json(await buildAnalyticsSummary(project.id, project.projectKey));
}));
app.get("/v1/admin/overview", requireOpsOrSuperadmin, asyncHandler(async (_req, res) => {
    const counts = await pool.query(`SELECT
       (SELECT COUNT(*)::int FROM tenants) AS tenants,
       (SELECT COUNT(*)::int FROM users) AS users,
       (SELECT COUNT(*)::int FROM projects) AS projects,
       (SELECT COUNT(*)::int FROM access_requests WHERE status = 'pending') AS pending_requests,
       (SELECT COUNT(*)::int FROM lead_events) AS leads,
       (SELECT COUNT(*)::int FROM conversations) AS conversations`);
    const recentRequests = await pool.query(`SELECT id, name, company, email, status, created_at AS "createdAt"
     FROM access_requests
     ORDER BY created_at DESC
     LIMIT 8`);
    res.json({
        counts: counts.rows[0],
        recentRequests: recentRequests.rows,
    });
}));
app.get("/v1/admin/platform-settings", requireOpsOrSuperadmin, asyncHandler(async (_req, res) => {
    res.json(await getPlatformSettings());
}));
app.post("/v1/admin/platform-settings", requireOpsOrSuperadmin, asyncHandler(async (req, res) => {
    const parsed = platformSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ code: "INVALID_INPUT", issues: parsed.error.flatten() });
        return;
    }
    const current = await getPlatformSettings();
    const nextSettings = {
        ...current,
        ...parsed.data,
    };
    const result = await pool.query(`UPDATE platform_settings
     SET brand_name = $1,
         legal_name = $2,
         tagline = $3,
         summary = $4,
         support_email = $5,
         website_url = $6,
         product_domain = $7,
         portal_base_url = $8,
         api_base_url = $9,
         widget_base_url = $10,
         developed_by = $11,
         demo_project_key = $12,
         demo_site_key = $13,
         default_locale = $14,
         supported_locales = $15::jsonb,
         seo_title = $16,
         seo_description = $17,
         seo_keywords = $18::jsonb,
         seo_image_url = $19,
         organization_name = $20,
         contact_email = $21,
         hero_points = $22::jsonb,
         feature_flags = $23::jsonb,
         updated_at = NOW()
     WHERE id = 'default'
     RETURNING *`, [
        nextSettings.brandName,
        nextSettings.legalName,
        nextSettings.tagline,
        nextSettings.summary,
        nextSettings.supportEmail,
        nextSettings.websiteUrl,
        nextSettings.productDomain,
        nextSettings.portalBaseUrl,
        nextSettings.apiBaseUrl,
        nextSettings.widgetBaseUrl,
        nextSettings.developedBy,
        nextSettings.demoProjectKey,
        nextSettings.demoSiteKey,
        nextSettings.defaultLocale,
        JSON.stringify(nextSettings.supportedLocales),
        nextSettings.seoTitle,
        nextSettings.seoDescription,
        JSON.stringify(nextSettings.seoKeywords),
        nextSettings.seoImageUrl,
        nextSettings.organizationName,
        nextSettings.contactEmail,
        JSON.stringify(nextSettings.heroPoints),
        JSON.stringify(nextSettings.featureFlags),
    ]);
    res.json(normalizePlatformSettings(result.rows[0]));
}));
app.get("/v1/admin/access-requests", requireOpsOrSuperadmin, asyncHandler(async (_req, res) => {
    const result = await pool.query(`SELECT
       id,
       name,
       company,
       email,
       phone,
       message,
       requested_tenant_name AS "requestedTenantName",
       status,
       review_notes AS "reviewNotes",
       reviewed_at AS "reviewedAt",
       reviewed_by AS "reviewedBy",
       created_at AS "createdAt"
     FROM access_requests
     ORDER BY created_at DESC`);
    res.json(result.rows);
}));
app.post("/v1/admin/access-requests/:id/review", requireOpsOrSuperadmin, asyncHandler(async (req, res) => {
    const parsed = reviewAccessRequestSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ code: "INVALID_INPUT", issues: parsed.error.flatten() });
        return;
    }
    const portalReq = req;
    const accessRequest = await pool.query("SELECT * FROM access_requests WHERE id = $1 LIMIT 1", [req.params.id]);
    if (!accessRequest.rowCount) {
        res.status(404).json({ code: "NOT_FOUND", message: "Access request not found" });
        return;
    }
    const row = accessRequest.rows[0];
    if (row.status === "accepted" || row.status === "rejected") {
        res.status(409).json({ code: "ALREADY_REVIEWED", message: "Access request already reviewed" });
        return;
    }
    if (parsed.data.decision === "rejected") {
        await pool.query(`UPDATE access_requests
       SET status = 'rejected',
           review_notes = $1,
           reviewed_at = NOW(),
           reviewed_by = $2
       WHERE id = $3`, [parsed.data.notes ?? null, portalReq.user?.id ?? null, row.id]);
        res.json({ ok: true, decision: "rejected" });
        return;
    }
    const tenantSlug = parsed.data.tenantSlug ?? slugify(parsed.data.tenantName ?? row.requested_tenant_name);
    const tenantName = parsed.data.tenantName ?? row.requested_tenant_name;
    const tenantResult = await pool.query(`INSERT INTO tenants (slug, name, status, brand_name, metadata)
     VALUES ($1, $2, 'active', $2, $3::jsonb)
     ON CONFLICT (slug)
     DO UPDATE SET
       name = EXCLUDED.name,
       brand_name = COALESCE(tenants.brand_name, EXCLUDED.brand_name),
       updated_at = NOW()
     RETURNING *`, [tenantSlug, tenantName, JSON.stringify({ source: "access_request", requestId: row.id })]);
    const tenant = normalizeTenant(tenantResult.rows[0]);
    const userResult = await pool.query(`INSERT INTO users (email, display_name, platform_role, status)
     VALUES ($1, $2, 'member', 'pending')
     ON CONFLICT (email)
     DO UPDATE SET
       display_name = COALESCE(users.display_name, EXCLUDED.display_name),
       updated_at = NOW()
     RETURNING id, email, display_name, platform_role, status`, [row.email, parsed.data.displayName ?? row.name]);
    const userId = userResult.rows[0].id;
    await pool.query(`INSERT INTO tenant_memberships (tenant_id, user_id, role)
     VALUES ($1, $2, 'admin')
     ON CONFLICT (tenant_id, user_id)
     DO UPDATE SET role = EXCLUDED.role, updated_at = NOW()`, [tenant.id, userId]);
    await pool.query(`UPDATE access_requests
     SET status = 'accepted',
         review_notes = $1,
         reviewed_at = NOW(),
         reviewed_by = $2
     WHERE id = $3`, [parsed.data.notes ?? null, portalReq.user?.id ?? null, row.id]);
    const issued = await issuePasswordResetToken(userId);
    const activationUrl = new URL("/reset-password", env.PORTAL_PUBLIC_URL);
    activationUrl.searchParams.set("token", issued.rawToken);
    await sendMail(row.email, "Acceso aprobado al portal del chatbot", `Tu acceso ha sido aprobado. Completa el alta en: ${activationUrl.toString()}`);
    res.json({
        ok: true,
        decision: "accepted",
        tenant,
        activationUrl: env.NODE_ENV === "production" ? undefined : activationUrl.toString(),
        setupToken: env.NODE_ENV === "production" ? undefined : issued.rawToken,
    });
}));
app.get("/v1/admin/tenants", requireOpsOrSuperadmin, asyncHandler(async (_req, res) => {
    const result = await pool.query(`SELECT
       t.*,
       COUNT(DISTINCT p.id)::int AS project_count,
       COUNT(DISTINCT tm.user_id)::int AS member_count
     FROM tenants t
     LEFT JOIN projects p ON p.tenant_id = t.id
     LEFT JOIN tenant_memberships tm ON tm.tenant_id = t.id
     GROUP BY t.id
     ORDER BY t.name ASC`);
    res.json(result.rows);
}));
app.post("/v1/admin/tenants", requireOpsOrSuperadmin, asyncHandler(async (req, res) => {
    const parsed = tenantSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ code: "INVALID_INPUT", issues: parsed.error.flatten() });
        return;
    }
    const payload = parsed.data;
    const result = await pool.query(`INSERT INTO tenants (id, slug, name, status, brand_name, public_base_url, metadata)
     VALUES (COALESCE($1::uuid, gen_random_uuid()), $2, $3, $4, $5, $6, $7::jsonb)
     ON CONFLICT (slug)
     DO UPDATE SET
       name = EXCLUDED.name,
       status = EXCLUDED.status,
       brand_name = EXCLUDED.brand_name,
       public_base_url = EXCLUDED.public_base_url,
       metadata = EXCLUDED.metadata,
       updated_at = NOW()
     RETURNING *`, [
        payload.id ?? null,
        payload.slug,
        payload.name,
        payload.status,
        payload.brandName ?? payload.name,
        payload.publicBaseUrl ?? null,
        JSON.stringify(payload.metadata ?? {}),
    ]);
    res.status(201).json(normalizeTenant(result.rows[0]));
}));
app.get("/v1/admin/users", requireOpsOrSuperadmin, asyncHandler(async (_req, res) => {
    const result = await pool.query(`SELECT
       u.id,
       u.email,
       u.display_name AS "displayName",
       u.platform_role AS "platformRole",
       u.status,
       u.created_at AS "createdAt",
       u.last_login_at AS "lastLoginAt",
       COALESCE(
         json_agg(
           json_build_object(
             'tenantId', tm.tenant_id,
             'tenantName', t.name,
             'tenantSlug', t.slug,
             'role', tm.role
           )
         ) FILTER (WHERE tm.id IS NOT NULL),
         '[]'::json
       ) AS memberships
     FROM users u
     LEFT JOIN tenant_memberships tm ON tm.user_id = u.id
     LEFT JOIN tenants t ON t.id = tm.tenant_id
     GROUP BY u.id
     ORDER BY u.created_at DESC`);
    res.json(result.rows);
}));
app.post("/v1/admin/users", requireOpsOrSuperadmin, asyncHandler(async (req, res) => {
    const parsed = userSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ code: "INVALID_INPUT", issues: parsed.error.flatten() });
        return;
    }
    const payload = parsed.data;
    const passwordHash = payload.password ? await bcrypt.hash(payload.password, 10) : null;
    const result = await pool.query(`INSERT INTO users (id, email, display_name, platform_role, status, password_hash)
     VALUES (COALESCE($1::uuid, gen_random_uuid()), $2, $3, $4, $5, $6)
     ON CONFLICT (email)
     DO UPDATE SET
       display_name = EXCLUDED.display_name,
       platform_role = EXCLUDED.platform_role,
       status = EXCLUDED.status,
       password_hash = COALESCE(EXCLUDED.password_hash, users.password_hash),
       updated_at = NOW()
     RETURNING id`, [
        payload.id ?? null,
        payload.email,
        payload.displayName ?? null,
        payload.platformRole,
        payload.status,
        passwordHash,
    ]);
    const user = await loadPortalUserById(result.rows[0].id);
    res.status(201).json(user);
}));
app.post("/v1/admin/memberships", requireOpsOrSuperadmin, asyncHandler(async (req, res) => {
    const parsed = membershipSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ code: "INVALID_INPUT", issues: parsed.error.flatten() });
        return;
    }
    await pool.query(`INSERT INTO tenant_memberships (tenant_id, user_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (tenant_id, user_id)
     DO UPDATE SET role = EXCLUDED.role, updated_at = NOW()`, [parsed.data.tenantId, parsed.data.userId, parsed.data.role]);
    const user = await loadPortalUserById(parsed.data.userId);
    res.status(201).json(user);
}));
app.post("/v1/admin/projects", requireOpsOrSuperadmin, asyncHandler(async (req, res) => {
    const parsed = createProjectSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ code: "INVALID_INPUT", issues: parsed.error.flatten() });
        return;
    }
    const tenant = await resolveProjectTenant(parsed.data);
    if (!tenant) {
        res.status(404).json({ code: "NOT_FOUND", message: "Tenant not found" });
        return;
    }
    const project = await upsertProjectForTenant(parsed.data, tenant.id);
    res.status(201).json(project);
}));
app.post("/v1/admin/sources", requireOpsOrSuperadmin, asyncHandler(async (req, res) => {
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
    const result = await pool.query(`INSERT INTO sources (
       project_id, source_key, kind, entry_url, include_patterns, exclude_patterns, allowed_domains, visibility, default_category, source_config
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
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
     RETURNING *`, [
        project.id,
        parsed.data.sourceKey,
        parsed.data.kind,
        parsed.data.entryUrl,
        parsed.data.includePatterns,
        parsed.data.excludePatterns,
        parsed.data.allowedDomains,
        parsed.data.visibility,
        parsed.data.defaultCategory ?? null,
        JSON.stringify(parsed.data.sourceConfig ?? {}),
    ]);
    res.status(201).json(result.rows[0]);
}));
app.post("/v1/admin/ingestions", requireOpsOrSuperadmin, asyncHandler(async (req, res) => {
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
    const result = await pool.query(`INSERT INTO ingestion_jobs (project_id, source_id, status, requested_by)
     VALUES ($1, $2, 'queued', $3)
     RETURNING id, status, created_at AS "createdAt"`, [project.id, source.id, parsed.data.requestedBy ?? "ops-cli"]);
    res.status(201).json(result.rows[0]);
}));
app.get("/v1/admin/ingestions/:id", requireOpsOrSuperadmin, asyncHandler(async (req, res) => {
    const result = await pool.query(`SELECT id, project_id AS "projectId", source_id AS "sourceId", status, summary, error_text AS "errorText", created_at AS "createdAt", started_at AS "startedAt", finished_at AS "finishedAt"
     FROM ingestion_jobs
     WHERE id = $1
     LIMIT 1`, [req.params.id]);
    if (!result.rowCount) {
        res.status(404).json({ code: "NOT_FOUND", message: "Ingestion not found" });
        return;
    }
    res.json(result.rows[0]);
}));
app.post("/v1/admin/evals", requireOpsOrSuperadmin, asyncHandler(async (req, res) => {
    const projectKey = String(req.body?.projectKey ?? "");
    const project = await getProjectByKey(projectKey);
    if (!project) {
        res.status(404).json({ code: "NOT_FOUND", message: "Project not found" });
        return;
    }
    const prompts = [
        "What does Talkaris do",
        "How can I embed the Talkaris widget",
        "How do I request a demo",
        "How does multi tenant administration work",
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
}));
app.get("/v1/admin/analytics/summary", requireOpsOrSuperadmin, asyncHandler(async (req, res) => {
    const projectKey = String(req.query.projectKey ?? "");
    const project = await getProjectByKey(projectKey);
    if (!project) {
        res.status(404).json({ code: "NOT_FOUND", message: "Project not found" });
        return;
    }
    res.json(await buildAnalyticsSummary(project.id, project.projectKey));
}));
// ─── V1.5 ENDPOINTS ───────────────────────────────────────────────────────────
// Members
app.get("/v1/portal/tenants/:tenantId/members", requireTenantRead, asyncHandler(async (req, res) => {
    const { tenantId } = req.params;
    const rows = await pool.query(`SELECT u.id AS "userId", u.email, u.display_name AS "displayName",
            tm.role, u.status, tm.created_at AS "joinedAt"
     FROM tenant_memberships tm JOIN users u ON tm.user_id = u.id
     WHERE tm.tenant_id = $1 ORDER BY tm.created_at ASC`, [tenantId]);
    res.json(rows.rows);
}));
app.put("/v1/portal/tenants/:tenantId/members/:userId", requireTenantRead, asyncHandler(async (req, res) => {
    const { tenantId, userId } = req.params;
    if (req.tenantMembership?.role !== "admin") {
        res.status(403).json({ code: "FORBIDDEN" });
        return;
    }
    const { role } = z.object({ role: z.enum(["admin", "editor", "viewer"]) }).parse(req.body);
    const r = await pool.query(`UPDATE tenant_memberships SET role = $1 WHERE tenant_id = $2 AND user_id = $3 RETURNING *`, [role, tenantId, userId]);
    if (!r.rows[0]) {
        res.status(404).json({ code: "NOT_FOUND" });
        return;
    }
    res.json(r.rows[0]);
}));
app.delete("/v1/portal/tenants/:tenantId/members/:userId", requireTenantRead, asyncHandler(async (req, res) => {
    const { tenantId, userId } = req.params;
    if (req.tenantMembership?.role !== "admin") {
        res.status(403).json({ code: "FORBIDDEN" });
        return;
    }
    await pool.query(`DELETE FROM tenant_memberships WHERE tenant_id = $1 AND user_id = $2`, [tenantId, userId]);
    res.status(204).end();
}));
app.post("/v1/portal/tenants/:tenantId/invitations", requireTenantRead, asyncHandler(async (req, res) => {
    const { tenantId } = req.params;
    if (req.tenantMembership?.role !== "admin") {
        res.status(403).json({ code: "FORBIDDEN" });
        return;
    }
    const { email, role } = z.object({ email: z.string().email(), role: z.enum(["admin", "editor", "viewer"]).default("editor") }).parse(req.body);
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await pool.query(`INSERT INTO invitations (tenant_id, email, role, invited_by, token_hash)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT ON CONSTRAINT idx_invitations_tenant_email DO UPDATE SET role = EXCLUDED.role, token_hash = EXCLUDED.token_hash, expires_at = NOW() + INTERVAL '7 days'`, [tenantId, email, role, req.user?.id ?? null, tokenHash]);
    res.json({ message: "Invitation sent" });
}));
// API Keys
app.get("/v1/portal/tenants/:tenantId/api-keys", requireTenantRead, asyncHandler(async (req, res) => {
    const { tenantId } = req.params;
    const r = await pool.query(`SELECT id, name, key_prefix AS prefix, scopes, last_used_at AS "lastUsedAt", expires_at AS "expiresAt", created_at AS "createdAt"
     FROM api_keys WHERE tenant_id = $1 ORDER BY created_at DESC`, [tenantId]);
    res.json(r.rows);
}));
app.post("/v1/portal/tenants/:tenantId/api-keys", requireTenantRead, asyncHandler(async (req, res) => {
    const { tenantId } = req.params;
    if (req.tenantMembership?.role !== "admin") {
        res.status(403).json({ code: "FORBIDDEN" });
        return;
    }
    const { name, scopes, expiresAt } = z.object({
        name: z.string().min(1).max(80),
        scopes: z.array(z.string()).default([]),
        expiresAt: z.string().datetime().optional(),
    }).parse(req.body);
    const rawKey = `tlk_${randomBytes(24).toString("hex")}`;
    const keyHash = createHash("sha256").update(rawKey).digest("hex");
    const keyPrefix = rawKey.slice(0, 12);
    const r = await pool.query(`INSERT INTO api_keys (tenant_id, name, key_hash, key_prefix, scopes, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, key_prefix AS prefix, scopes, last_used_at AS "lastUsedAt", expires_at AS "expiresAt", created_at AS "createdAt"`, [tenantId, name, keyHash, keyPrefix, scopes, expiresAt ?? null]);
    res.status(201).json({ ...r.rows[0], key: rawKey });
}));
app.delete("/v1/portal/tenants/:tenantId/api-keys/:keyId", requireTenantRead, asyncHandler(async (req, res) => {
    const { tenantId, keyId } = req.params;
    if (req.tenantMembership?.role !== "admin") {
        res.status(403).json({ code: "FORBIDDEN" });
        return;
    }
    await pool.query(`DELETE FROM api_keys WHERE id = $1 AND tenant_id = $2`, [keyId, tenantId]);
    res.status(204).end();
}));
// Webhooks
app.get("/v1/portal/tenants/:tenantId/webhooks", requireTenantRead, asyncHandler(async (req, res) => {
    const { tenantId } = req.params;
    const r = await pool.query(`SELECT id, url, events, description, active, created_at AS "createdAt" FROM webhooks WHERE tenant_id = $1 ORDER BY created_at DESC`, [tenantId]);
    res.json(r.rows);
}));
app.post("/v1/portal/tenants/:tenantId/webhooks", requireTenantRead, asyncHandler(async (req, res) => {
    const { tenantId } = req.params;
    if (req.tenantMembership?.role !== "admin") {
        res.status(403).json({ code: "FORBIDDEN" });
        return;
    }
    const { url, events, description } = z.object({
        url: z.string().url(),
        events: z.array(z.string()).min(1),
        description: z.string().max(200).optional(),
    }).parse(req.body);
    const secret = `whsec_${randomBytes(24).toString("hex")}`;
    const secretHash = createHash("sha256").update(secret).digest("hex");
    const r = await pool.query(`INSERT INTO webhooks (tenant_id, url, events, secret_hash, description)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, url, events, description, active, created_at AS "createdAt"`, [tenantId, url, events, secretHash, description ?? null]);
    res.status(201).json({ ...r.rows[0], secret });
}));
app.put("/v1/portal/tenants/:tenantId/webhooks/:webhookId", requireTenantRead, asyncHandler(async (req, res) => {
    const { tenantId, webhookId } = req.params;
    if (req.tenantMembership?.role !== "admin") {
        res.status(403).json({ code: "FORBIDDEN" });
        return;
    }
    const body = z.object({
        url: z.string().url().optional(),
        events: z.array(z.string()).min(1).optional(),
        description: z.string().max(200).nullable().optional(),
        active: z.boolean().optional(),
    }).parse(req.body);
    const sets = ["updated_at = NOW()"];
    const vals = [webhookId, tenantId];
    let i = 3;
    if (body.url !== undefined) {
        sets.push(`url = $${i++}`);
        vals.push(body.url);
    }
    if (body.events !== undefined) {
        sets.push(`events = $${i++}`);
        vals.push(body.events);
    }
    if (body.description !== undefined) {
        sets.push(`description = $${i++}`);
        vals.push(body.description);
    }
    if (body.active !== undefined) {
        sets.push(`active = $${i++}`);
        vals.push(body.active);
    }
    const r = await pool.query(`UPDATE webhooks SET ${sets.join(", ")} WHERE id = $1 AND tenant_id = $2 RETURNING id, url, events, description, active, created_at AS "createdAt"`, vals);
    if (!r.rows[0]) {
        res.status(404).json({ code: "NOT_FOUND" });
        return;
    }
    res.json(r.rows[0]);
}));
app.delete("/v1/portal/tenants/:tenantId/webhooks/:webhookId", requireTenantRead, asyncHandler(async (req, res) => {
    const { tenantId, webhookId } = req.params;
    if (req.tenantMembership?.role !== "admin") {
        res.status(403).json({ code: "FORBIDDEN" });
        return;
    }
    await pool.query(`DELETE FROM webhooks WHERE id = $1 AND tenant_id = $2`, [webhookId, tenantId]);
    res.status(204).end();
}));
app.post("/v1/portal/tenants/:tenantId/webhooks/:webhookId/test", requireTenantRead, asyncHandler(async (req, res) => {
    const { tenantId, webhookId } = req.params;
    const r = await pool.query(`SELECT url FROM webhooks WHERE id = $1 AND tenant_id = $2`, [webhookId, tenantId]);
    if (!r.rows[0]) {
        res.status(404).json({ code: "NOT_FOUND" });
        return;
    }
    try {
        const resp = await fetch(r.rows[0].url, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Talkaris-Event": "webhook.test" },
            body: JSON.stringify({ event: "webhook.test", timestamp: new Date().toISOString() }),
            signal: AbortSignal.timeout(5000),
        });
        res.json({ ok: resp.ok, statusCode: resp.status });
    }
    catch {
        res.json({ ok: false, statusCode: 0 });
    }
}));
// Ingestion Schedules
app.get("/v1/portal/tenants/:tenantId/ingestion-schedules", requireTenantRead, asyncHandler(async (req, res) => {
    const { tenantId } = req.params;
    const r = await pool.query(`SELECT id, name, source_ids AS "sourceIds", cron_expr AS "cronExpr", active,
            last_run_at AS "lastRunAt", next_run_at AS "nextRunAt", created_at AS "createdAt"
     FROM ingestion_schedules WHERE tenant_id = $1 ORDER BY created_at DESC`, [tenantId]);
    res.json(r.rows);
}));
app.post("/v1/portal/tenants/:tenantId/ingestion-schedules", requireTenantRead, asyncHandler(async (req, res) => {
    const { tenantId } = req.params;
    if (req.tenantMembership?.role === "viewer") {
        res.status(403).json({ code: "FORBIDDEN" });
        return;
    }
    const { name, sourceIds, cronExpr } = z.object({
        name: z.string().min(1).max(80),
        sourceIds: z.array(z.string().uuid()).min(1),
        cronExpr: z.string().min(7),
    }).parse(req.body);
    const r = await pool.query(`INSERT INTO ingestion_schedules (tenant_id, name, source_ids, cron_expr)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, source_ids AS "sourceIds", cron_expr AS "cronExpr", active,
               last_run_at AS "lastRunAt", next_run_at AS "nextRunAt", created_at AS "createdAt"`, [tenantId, name, sourceIds, cronExpr]);
    res.status(201).json(r.rows[0]);
}));
app.put("/v1/portal/tenants/:tenantId/ingestion-schedules/:scheduleId", requireTenantRead, asyncHandler(async (req, res) => {
    const { tenantId, scheduleId } = req.params;
    if (req.tenantMembership?.role === "viewer") {
        res.status(403).json({ code: "FORBIDDEN" });
        return;
    }
    const body = z.object({
        name: z.string().min(1).max(80).optional(),
        sourceIds: z.array(z.string().uuid()).optional(),
        cronExpr: z.string().min(7).optional(),
        active: z.boolean().optional(),
    }).parse(req.body);
    const sets = ["updated_at = NOW()"];
    const vals = [scheduleId, tenantId];
    let i = 3;
    if (body.name !== undefined) {
        sets.push(`name = $${i++}`);
        vals.push(body.name);
    }
    if (body.sourceIds !== undefined) {
        sets.push(`source_ids = $${i++}`);
        vals.push(body.sourceIds);
    }
    if (body.cronExpr !== undefined) {
        sets.push(`cron_expr = $${i++}`);
        vals.push(body.cronExpr);
    }
    if (body.active !== undefined) {
        sets.push(`active = $${i++}`);
        vals.push(body.active);
    }
    const r = await pool.query(`UPDATE ingestion_schedules SET ${sets.join(", ")} WHERE id = $1 AND tenant_id = $2
     RETURNING id, name, source_ids AS "sourceIds", cron_expr AS "cronExpr", active,
               last_run_at AS "lastRunAt", next_run_at AS "nextRunAt", created_at AS "createdAt"`, vals);
    if (!r.rows[0]) {
        res.status(404).json({ code: "NOT_FOUND" });
        return;
    }
    res.json(r.rows[0]);
}));
app.delete("/v1/portal/tenants/:tenantId/ingestion-schedules/:scheduleId", requireTenantRead, asyncHandler(async (req, res) => {
    const { tenantId, scheduleId } = req.params;
    if (req.tenantMembership?.role === "viewer") {
        res.status(403).json({ code: "FORBIDDEN" });
        return;
    }
    await pool.query(`DELETE FROM ingestion_schedules WHERE id = $1 AND tenant_id = $2`, [scheduleId, tenantId]);
    res.status(204).end();
}));
// Notification Preferences
app.get("/v1/portal/tenants/:tenantId/notification-prefs", requireTenantRead, asyncHandler(async (req, res) => {
    const { tenantId } = req.params;
    const r = await pool.query(`SELECT email_recipients AS "emailRecipients", lead_created AS "leadCreated",
            ingestion_failed AS "ingestionFailed", low_confidence_alert AS "lowConfidenceAlert",
            low_confidence_threshold AS "lowConfidenceThreshold", digest_frequency AS "digestFrequency"
     FROM notification_prefs WHERE tenant_id = $1`, [tenantId]);
    res.json(r.rows[0] ?? { emailRecipients: [], leadCreated: true, ingestionFailed: true, lowConfidenceAlert: false, lowConfidenceThreshold: 0.3, digestFrequency: "none" });
}));
app.put("/v1/portal/tenants/:tenantId/notification-prefs", requireTenantRead, asyncHandler(async (req, res) => {
    const { tenantId } = req.params;
    if (req.tenantMembership?.role !== "admin") {
        res.status(403).json({ code: "FORBIDDEN" });
        return;
    }
    const body = z.object({
        emailRecipients: z.array(z.string().email()).optional(),
        leadCreated: z.boolean().optional(),
        ingestionFailed: z.boolean().optional(),
        lowConfidenceAlert: z.boolean().optional(),
        lowConfidenceThreshold: z.number().min(0).max(1).optional(),
        digestFrequency: z.enum(["none", "daily", "weekly"]).optional(),
    }).parse(req.body);
    const r = await pool.query(`INSERT INTO notification_prefs (tenant_id, email_recipients, lead_created, ingestion_failed, low_confidence_alert, low_confidence_threshold, digest_frequency)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (tenant_id) DO UPDATE SET
       email_recipients = COALESCE($2, notification_prefs.email_recipients),
       lead_created = COALESCE($3, notification_prefs.lead_created),
       ingestion_failed = COALESCE($4, notification_prefs.ingestion_failed),
       low_confidence_alert = COALESCE($5, notification_prefs.low_confidence_alert),
       low_confidence_threshold = COALESCE($6, notification_prefs.low_confidence_threshold),
       digest_frequency = COALESCE($7, notification_prefs.digest_frequency),
       updated_at = NOW()
     RETURNING email_recipients AS "emailRecipients", lead_created AS "leadCreated",
               ingestion_failed AS "ingestionFailed", low_confidence_alert AS "lowConfidenceAlert",
               low_confidence_threshold AS "lowConfidenceThreshold", digest_frequency AS "digestFrequency"`, [
        tenantId,
        body.emailRecipients ?? null,
        body.leadCreated ?? null,
        body.ingestionFailed ?? null,
        body.lowConfidenceAlert ?? null,
        body.lowConfidenceThreshold ?? null,
        body.digestFrequency ?? null,
    ]);
    res.json(r.rows[0]);
}));
// Handover — Widget
app.post("/v1/widget/conversations/:conversationId/handover", asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const { reason } = z.object({ reason: z.string().max(500).optional() }).parse(req.body);
    const conv = await pool.query(`SELECT project_id FROM conversations WHERE id = $1`, [conversationId]);
    if (!conv.rows[0]) {
        res.status(404).json({ code: "NOT_FOUND" });
        return;
    }
    const projectId = conv.rows[0].project_id;
    await pool.query(`INSERT INTO handover_events (conversation_id, project_id, reason) VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING`, [conversationId, projectId, reason ?? null]);
    // Emit webhook if any active webhook for this tenant listens to handover.requested
    const tenantRow = await pool.query(`SELECT tenant_id FROM projects WHERE id = $1`, [projectId]);
    if (tenantRow.rows[0]) {
        const webhooks = await pool.query(`SELECT url, secret_hash FROM webhooks WHERE tenant_id = $1 AND active = true AND $2 = ANY(events)`, [tenantRow.rows[0].tenant_id, "handover.requested"]);
        const payload = JSON.stringify({ event: "handover.requested", conversationId, reason, timestamp: new Date().toISOString() });
        for (const wh of webhooks.rows) {
            const sig = createHash("sha256").update(`${wh.secret_hash}.${payload}`).digest("hex");
            fetch(wh.url, {
                method: "POST",
                headers: { "Content-Type": "application/json", "X-Talkaris-Signature": sig, "X-Talkaris-Event": "handover.requested" },
                body: payload,
                signal: AbortSignal.timeout(5000),
            }).catch(() => { });
        }
    }
    res.json({ ok: true, message: "An agent will be with you shortly." });
}));
// Handover status — Portal
app.get("/v1/portal/tenants/:tenantId/conversations/:conversationId/handover", requireTenantRead, asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const r = await pool.query(`SELECT id, status, reason, created_at AS "createdAt" FROM handover_events WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT 1`, [conversationId]);
    res.json(r.rows[0] ?? null);
}));
app.put("/v1/portal/tenants/:tenantId/conversations/:conversationId/handover", requireTenantRead, asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const { status } = z.object({ status: z.enum(["pending", "assigned", "closed"]) }).parse(req.body);
    const r = await pool.query(`UPDATE handover_events SET status = $1 WHERE conversation_id = $2 RETURNING id, status, reason, created_at AS "createdAt"`, [status, conversationId]);
    if (!r.rows[0]) {
        res.status(404).json({ code: "NOT_FOUND" });
        return;
    }
    res.json(r.rows[0]);
}));
// CSAT — Widget
app.post("/v1/widget/conversations/:conversationId/rating", asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const { score, comment } = z.object({
        score: z.number().int().min(1).max(5),
        comment: z.string().max(1000).optional(),
    }).parse(req.body);
    const conv = await pool.query(`SELECT project_id FROM conversations WHERE id = $1`, [conversationId]);
    if (!conv.rows[0]) {
        res.status(404).json({ code: "NOT_FOUND" });
        return;
    }
    await pool.query(`INSERT INTO conversation_ratings (conversation_id, project_id, score, comment)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT ON CONSTRAINT idx_conversation_ratings_unique DO UPDATE SET score = $3, comment = $4`, [conversationId, conv.rows[0].project_id, score, comment ?? null]);
    res.json({ ok: true });
}));
// CSAT — Single conversation rating (portal)
app.get("/v1/portal/tenants/:tenantId/conversations/:conversationId/rating", requireTenantRead, asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const r = await pool.query(`SELECT score, comment FROM conversation_ratings WHERE conversation_id = $1`, [conversationId]);
    res.json(r.rows[0] ?? null);
}));
// CSAT — Analytics
app.get("/v1/portal/tenants/:tenantId/analytics/satisfaction", requireTenantRead, asyncHandler(async (req, res) => {
    const { tenantId } = req.params;
    const projectKey = req.query["projectKey"];
    let projectFilter = "";
    const vals = [tenantId];
    if (projectKey) {
        const pRow = await pool.query(`SELECT id FROM projects WHERE project_key = $1 AND tenant_id = $2`, [projectKey, tenantId]);
        if (!pRow.rows[0]) {
            res.status(404).json({ code: "NOT_FOUND" });
            return;
        }
        projectFilter = `AND cr.project_id = $2`;
        vals.push(pRow.rows[0].id);
    }
    const r = await pool.query(`SELECT ROUND(AVG(cr.score)::numeric, 2) AS avg,
            COUNT(*) AS total,
            jsonb_object_agg(bucket.s, COALESCE(cnt.c, 0)) AS distribution
     FROM (SELECT generate_series(1,5) AS s) bucket
     LEFT JOIN (
       SELECT cr.score, COUNT(*) AS c
       FROM conversation_ratings cr
       JOIN projects p ON cr.project_id = p.id
       WHERE p.tenant_id = $1 ${projectFilter}
       GROUP BY cr.score
     ) cnt ON cnt.score = bucket.s,
     conversation_ratings cr
     JOIN projects p ON cr.project_id = p.id
     WHERE p.tenant_id = $1 ${projectFilter}`, vals);
    const comments = await pool.query(`SELECT cr.score, cr.comment, cr.created_at AS date
     FROM conversation_ratings cr
     JOIN projects p ON cr.project_id = p.id
     WHERE p.tenant_id = $1 ${projectFilter} AND cr.comment IS NOT NULL
     ORDER BY cr.created_at DESC LIMIT 10`, vals);
    res.json({
        avg: Number(r.rows[0]?.avg ?? 0),
        total: Number(r.rows[0]?.total ?? 0),
        distribution: r.rows[0]?.distribution ?? {},
        recentComments: comments.rows,
    });
}));
// Bot Test Chat
app.post("/v1/portal/tenants/:tenantId/projects/:projectKey/test-chat", requireTenantRead, asyncHandler(async (req, res) => {
    const { tenantId, projectKey } = req.params;
    const { message } = z.object({ message: z.string().min(1).max(2000) }).parse(req.body);
    const pRow = await pool.query(`SELECT p.* FROM projects p WHERE p.project_key = $1 AND p.tenant_id = $2`, [projectKey, tenantId]);
    if (!pRow.rows[0]) {
        res.status(404).json({ code: "NOT_FOUND" });
        return;
    }
    const project = pRow.rows[0];
    const chunks = await retrieveChunks(project.id, message);
    const answer = composeAnswer(project, message, chunks);
    res.json({
        message: answer.message,
        citations: answer.citations ?? [],
        confidence: answer.confidence ?? 0,
        usedFallback: answer.usedFallback ?? false,
    });
}));
// Exports
app.get("/v1/portal/tenants/:tenantId/export/conversations", requireTenantRead, asyncHandler(async (req, res) => {
    const { tenantId } = req.params;
    const r = await pool.query(`SELECT c.id, c.session_id, p.project_key, c.started_at, c.ended_at,
            (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) AS message_count
     FROM conversations c JOIN projects p ON c.project_id = p.id
     WHERE p.tenant_id = $1 ORDER BY c.started_at DESC`, [tenantId]);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="conversations.csv"`);
    const header = "id,session_id,project_key,started_at,ended_at,message_count\n";
    const rows = r.rows.map((row) => `${row.id},${row.session_id},${row.project_key},${row.started_at},${row.ended_at ?? ""},${row.message_count}`).join("\n");
    res.send(header + rows);
}));
app.get("/v1/portal/tenants/:tenantId/export/leads", requireTenantRead, asyncHandler(async (req, res) => {
    const { tenantId } = req.params;
    const r = await pool.query(`SELECT le.id, le.name, le.email, le.phone, le.company, p.project_key, le.created_at
     FROM lead_events le JOIN projects p ON le.project_id = p.id
     WHERE p.tenant_id = $1 ORDER BY le.created_at DESC`, [tenantId]);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="leads.csv"`);
    const header = "id,name,email,phone,company,project_key,created_at\n";
    const rows = r.rows.map((row) => `${row.id},"${row.name ?? ""}","${row.email ?? ""}","${row.phone ?? ""}","${row.company ?? ""}",${row.project_key},${row.created_at}`).join("\n");
    res.send(header + rows);
}));
app.get("/v1/portal/tenants/:tenantId/export/analytics", requireTenantRead, asyncHandler(async (req, res) => {
    const { tenantId } = req.params;
    const r = await pool.query(`SELECT ae.id, ae.event_type, ae.session_id, p.project_key, ae.meta, ae.created_at
     FROM analytics_events ae JOIN projects p ON ae.project_id = p.id
     WHERE p.tenant_id = $1 ORDER BY ae.created_at DESC LIMIT 50000`, [tenantId]);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="analytics.csv"`);
    const header = "id,event_type,session_id,project_key,meta,created_at\n";
    const rows = r.rows.map((row) => `${row.id},${row.event_type},${row.session_id},${row.project_key},"${JSON.stringify(row.meta ?? {}).replace(/"/g, '""')}",${row.created_at}`).join("\n");
    res.send(header + rows);
}));
// ─── END V1.5 ENDPOINTS ───────────────────────────────────────────────────────
// ─── V2 ENDPOINTS ─────────────────────────────────────────────────────────────
// V2-B: AI config per project
const aiConfigSchema = z.object({
    provider: z.enum(["openai", "anthropic", "deepseek", "google", "local"]).optional(),
    model: z.string().max(100).optional(),
    temperature: z.number().min(0).max(1).optional(),
    maxTokens: z.number().int().min(256).max(4096).optional(),
    systemPromptAdditions: z.string().max(2000).optional(),
});
app.get("/v1/portal/tenants/:tenantId/projects/:projectKey/ai-config", requireTenantRead, asyncHandler(async (req, res) => {
    const { tenantId, projectKey } = req.params;
    const r = await pool.query(`SELECT ai_config FROM projects WHERE tenant_id = $1 AND project_key = $2`, [tenantId, projectKey]);
    if (!r.rows[0]) {
        res.status(404).json({ code: "NOT_FOUND" });
        return;
    }
    res.json(r.rows[0].ai_config ?? {});
}));
app.put("/v1/portal/tenants/:tenantId/projects/:projectKey/ai-config", requireTenantWrite, asyncHandler(async (req, res) => {
    const { tenantId, projectKey } = req.params;
    const config = aiConfigSchema.parse(req.body);
    const r = await pool.query(`UPDATE projects SET ai_config = $1 WHERE tenant_id = $2 AND project_key = $3 RETURNING ai_config`, [JSON.stringify(config), tenantId, projectKey]);
    if (!r.rows[0]) {
        res.status(404).json({ code: "NOT_FOUND" });
        return;
    }
    res.json(r.rows[0].ai_config);
}));
// V2-E: Toggle enable_handover per project
app.put("/v1/portal/tenants/:tenantId/projects/:projectKey/features", requireTenantWrite, asyncHandler(async (req, res) => {
    const { tenantId, projectKey } = req.params;
    const { enableHandover } = z.object({ enableHandover: z.boolean() }).parse(req.body);
    const r = await pool.query(`UPDATE projects SET enable_handover = $1 WHERE tenant_id = $2 AND project_key = $3 RETURNING project_key, enable_handover`, [enableHandover, tenantId, projectKey]);
    if (!r.rows[0]) {
        res.status(404).json({ code: "NOT_FOUND" });
        return;
    }
    res.json({ projectKey: r.rows[0].project_key, enableHandover: r.rows[0].enable_handover });
}));
// V2-C: Handover queue (all pending across tenant)
app.get("/v1/portal/tenants/:tenantId/handovers", requireTenantRead, asyncHandler(async (req, res) => {
    const { tenantId } = req.params;
    const status = req.query["status"] ?? "pending";
    const r = await pool.query(`SELECT he.id, he.status, he.reason, he.created_at AS "createdAt",
            he.claimed_by AS "claimedBy", he.claimed_at AS "claimedAt",
            he.resolved_at AS "resolvedAt", he.notes,
            c.session_id AS "sessionId", p.project_key AS "projectKey", p.bot_name AS "botName"
     FROM handover_events he
     JOIN conversations c ON c.id = he.conversation_id
     JOIN projects p ON p.id = he.project_id
     WHERE p.tenant_id = $1 AND he.status = $2
     ORDER BY he.created_at DESC
     LIMIT 100`, [tenantId, status]);
    res.json(r.rows);
}));
app.put("/v1/portal/tenants/:tenantId/handovers/:handoverId/claim", requireTenantWrite, asyncHandler(async (req, res) => {
    const { tenantId, handoverId } = req.params;
    const r = await pool.query(`UPDATE handover_events he
     SET status = 'assigned', claimed_by = $1, claimed_at = NOW()
     FROM projects p
     WHERE he.id = $2 AND he.project_id = p.id AND p.tenant_id = $3
     RETURNING he.id, he.status, he.reason, he.claimed_by AS "claimedBy",
               he.claimed_at AS "claimedAt", he.created_at AS "createdAt"`, [req.user.id, handoverId, tenantId]);
    if (!r.rows[0]) {
        res.status(404).json({ code: "NOT_FOUND" });
        return;
    }
    res.json(r.rows[0]);
}));
app.put("/v1/portal/tenants/:tenantId/handovers/:handoverId/resolve", requireTenantWrite, asyncHandler(async (req, res) => {
    const { tenantId, handoverId } = req.params;
    const { notes } = z.object({ notes: z.string().max(1000).optional() }).parse(req.body);
    const r = await pool.query(`UPDATE handover_events he
     SET status = 'closed', resolved_at = NOW(), notes = COALESCE($1, he.notes)
     FROM projects p
     WHERE he.id = $2 AND he.project_id = p.id AND p.tenant_id = $3
     RETURNING he.id, he.status, he.resolved_at AS "resolvedAt", he.notes, he.created_at AS "createdAt"`, [notes ?? null, handoverId, tenantId]);
    if (!r.rows[0]) {
        res.status(404).json({ code: "NOT_FOUND" });
        return;
    }
    res.json(r.rows[0]);
}));
// V2-D: RAG quality analytics
app.get("/v1/portal/tenants/:tenantId/analytics/rag-quality", requireTenantRead, asyncHandler(async (req, res) => {
    const { tenantId } = req.params;
    const { projectKey, period = "30d" } = req.query;
    const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
    const projectFilter = projectKey ? `AND p.project_key = $3` : "";
    const params = [tenantId, days];
    if (projectKey)
        params.push(projectKey);
    // Aggregate from analytics_events
    const r = await pool.query(`SELECT
       COUNT(*) FILTER (WHERE ae.event_type = 'message_sent') AS total_messages,
       COUNT(*) FILTER (WHERE ae.event_type = 'fallback_triggered') AS fallback_count,
       AVG((ae.meta->>'confidence')::numeric) FILTER (WHERE ae.meta ? 'confidence') AS avg_confidence,
       COUNT(*) FILTER (WHERE (ae.meta->>'confidence')::numeric < 0.3 AND ae.meta ? 'confidence') AS low_confidence_count
     FROM analytics_events ae
     JOIN projects p ON p.project_key = ae.project_key AND p.tenant_id = ae.tenant_id
     WHERE ae.tenant_id = $1
       AND ae.created_at >= NOW() - ($2 || ' days')::interval
       ${projectFilter}`, params);
    // Top unanswered questions
    const gapsR = await pool.query(`SELECT ae.meta->>'question' AS question, COUNT(*) AS cnt
     FROM analytics_events ae
     JOIN projects p ON p.project_key = ae.project_key AND p.tenant_id = ae.tenant_id
     WHERE ae.tenant_id = $1
       AND ae.event_type = 'unanswered_question'
       AND ae.created_at >= NOW() - ($2 || ' days')::interval
       ${projectFilter}
       AND ae.meta ? 'question'
     GROUP BY ae.meta->>'question'
     ORDER BY cnt DESC
     LIMIT 10`, params);
    const totMsg = parseInt(r.rows[0]?.total_messages ?? "0", 10);
    const fallbacks = parseInt(r.rows[0]?.fallback_count ?? "0", 10);
    const lowConf = parseInt(r.rows[0]?.low_confidence_count ?? "0", 10);
    const avgConf = r.rows[0]?.avg_confidence != null ? parseFloat(r.rows[0].avg_confidence) : null;
    const unanswered = gapsR.rows.map((row) => ({ question: row.question, count: parseInt(row.cnt, 10) }));
    res.json({
        period,
        totalMessages: totMsg,
        fallbackRate: totMsg > 0 ? Math.round((fallbacks / totMsg) * 1000) / 10 : 0,
        avgConfidence: avgConf != null ? Math.round(avgConf * 100) / 100 : null,
        lowConfidenceCount: lowConf,
        coverageScore: totMsg > 0 ? Math.round(((totMsg - fallbacks) / totMsg) * 100) : null,
        topGaps: unanswered,
    });
}));
// V3-C: Analytics trends (resolution rate, handover rate, daily series)
app.get("/v1/portal/tenants/:tenantId/analytics/trends", requireTenantRead, asyncHandler(async (req, res) => {
    const { tenantId } = req.params;
    const { projectKey, period = "30d" } = req.query;
    const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
    const projectFilter = projectKey ? `AND p.project_key = $3` : "";
    const params = [tenantId, days];
    if (projectKey)
        params.push(projectKey);
    // Resolution rate + handover rate + avg messages per conv + avg duration
    const ratesR = await pool.query(`SELECT
       COUNT(DISTINCT c.id) AS total_convs,
       COUNT(DISTINCT c.id) FILTER (WHERE NOT EXISTS (
         SELECT 1 FROM analytics_events ae2
         WHERE ae2.conversation_id = c.id::text AND ae2.event_type = 'fallback'
       )) AS resolved_convs,
       COUNT(DISTINCT he.conversation_id) AS handover_convs,
       AVG(msg_counts.cnt)::numeric AS avg_messages,
       AVG(EXTRACT(EPOCH FROM (last_msg.ts - c.created_at)) / 60)::numeric AS avg_duration_minutes
     FROM conversations c
     JOIN projects p ON p.id = c.project_id AND p.tenant_id = $1
     LEFT JOIN handover_events he ON he.conversation_id = c.id
     LEFT JOIN LATERAL (
       SELECT COUNT(*) AS cnt FROM messages m WHERE m.conversation_id = c.id
     ) msg_counts ON true
     LEFT JOIN LATERAL (
       SELECT MAX(m2.created_at) AS ts FROM messages m2 WHERE m2.conversation_id = c.id
     ) last_msg ON true
     WHERE c.created_at >= NOW() - ($2 || ' days')::interval
       ${projectFilter}`, params);
    // Daily series
    const dailyR = await pool.query(`SELECT
       DATE(ae.created_at) AS day,
       COUNT(*) FILTER (WHERE ae.event_type = 'message_sent') AS messages,
       COUNT(DISTINCT ae.conversation_id) FILTER (WHERE ae.event_type = 'response_served') AS resolved,
       COUNT(DISTINCT he2.conversation_id) AS handovers
     FROM analytics_events ae
     JOIN projects p ON p.project_key = ae.project_key AND p.tenant_id = ae.tenant_id
     LEFT JOIN handover_events he2 ON he2.conversation_id::text = ae.conversation_id
       AND DATE(he2.created_at) = DATE(ae.created_at)
     WHERE ae.tenant_id = $1
       AND ae.created_at >= NOW() - ($2 || ' days')::interval
       ${projectFilter}
     GROUP BY DATE(ae.created_at)
     ORDER BY day ASC`, params);
    const row = ratesR.rows[0] ?? {};
    const total = parseInt(row.total_convs ?? "0", 10);
    const resolved = parseInt(row.resolved_convs ?? "0", 10);
    const handovers = parseInt(row.handover_convs ?? "0", 10);
    res.json({
        period,
        resolutionRate: total > 0 ? Math.round((resolved / total) * 1000) / 10 : null,
        handoverRate: total > 0 ? Math.round((handovers / total) * 1000) / 10 : null,
        avgMessagesPerConversation: row.avg_messages != null ? Math.round(parseFloat(row.avg_messages) * 10) / 10 : null,
        avgConversationDurationMinutes: row.avg_duration_minutes != null ? Math.round(parseFloat(row.avg_duration_minutes) * 10) / 10 : null,
        dailySeries: dailyR.rows.map((r) => ({
            date: r.day.toISOString().slice(0, 10),
            messages: parseInt(r.messages ?? "0", 10),
            resolved: parseInt(r.resolved ?? "0", 10),
            handovers: parseInt(r.handovers ?? "0", 10),
        })),
    });
}));
// ─── V3-D: CHANNELS (TELEGRAM) ────────────────────────────────────────────────
// Portal: list channels for a project
app.get("/v1/portal/tenants/:tenantId/projects/:projectKey/channels", requireTenantRead, asyncHandler(async (req, res) => {
    const { tenantId, projectKey } = req.params;
    const r = await pool.query(`SELECT ch.id, ch.kind, ch.status, ch.created_at,
            (ch.config->>'botToken') IS NOT NULL AS has_token
     FROM channels ch
     JOIN projects p ON p.id = ch.project_id
     WHERE p.project_key = $1 AND p.tenant_id = $2
     ORDER BY ch.created_at DESC`, [projectKey, tenantId]);
    res.json(r.rows);
}));
// Portal: create a Telegram channel (registers webhook automatically)
app.post("/v1/portal/tenants/:tenantId/projects/:projectKey/channels", requireTenantWrite, asyncHandler(async (req, res) => {
    const { tenantId, projectKey } = req.params;
    const { botToken } = z.object({ botToken: z.string().min(10) }).parse(req.body);
    const projectR = await pool.query(`SELECT id FROM projects WHERE project_key = $1 AND tenant_id = $2 LIMIT 1`, [projectKey, tenantId]);
    if (!projectR.rowCount) {
        res.status(404).json({ code: "NOT_FOUND" });
        return;
    }
    const projectId = projectR.rows[0].id;
    const channelId = randomUUID();
    const webhookSecret = env.TELEGRAM_WEBHOOK_SECRET;
    // Build webhook URL pointing to this API's public base
    const apiBase = `${req.protocol}://${req.get("host")}`;
    const webhookUrl = `${apiBase}/v1/telegram/webhook/${channelId}`;
    // Register webhook with Telegram
    await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
            url: webhookUrl,
            secret_token: webhookSecret,
        }),
    });
    await pool.query(`INSERT INTO channels (id, project_id, kind, config, status)
     VALUES ($1, $2, 'telegram', $3::jsonb, 'active')`, [channelId, projectId, JSON.stringify({ botToken, webhookSecret })]);
    res.status(201).json({ id: channelId, kind: "telegram", status: "active", webhookUrl });
}));
// Portal: delete a channel (and unregister webhook)
app.delete("/v1/portal/tenants/:tenantId/projects/:projectKey/channels/:channelId", requireTenantWrite, asyncHandler(async (req, res) => {
    const { tenantId, projectKey, channelId } = req.params;
    const r = await pool.query(`SELECT ch.id, ch.kind, ch.config FROM channels ch
     JOIN projects p ON p.id = ch.project_id
     WHERE ch.id = $1 AND p.project_key = $2 AND p.tenant_id = $3 LIMIT 1`, [channelId, projectKey, tenantId]);
    if (!r.rowCount) {
        res.status(404).json({ code: "NOT_FOUND" });
        return;
    }
    const cfg = r.rows[0].config;
    if (cfg.botToken) {
        await fetch(`https://api.telegram.org/bot${cfg.botToken}/deleteWebhook`).catch(() => { });
    }
    await pool.query(`DELETE FROM channels WHERE id = $1`, [channelId]);
    res.json({ ok: true });
}));
// Public: Telegram webhook receiver
app.post("/v1/telegram/webhook/:channelId", asyncHandler(async (req, res) => {
    // Validate secret
    const secret = req.headers["x-telegram-bot-api-secret-token"];
    if (secret !== env.TELEGRAM_WEBHOOK_SECRET) {
        res.status(401).end();
        return;
    }
    const { channelId } = req.params;
    const update = req.body;
    const text = update.message?.text?.trim();
    const chatId = update.message?.chat?.id;
    if (!text || !chatId) {
        res.json({ ok: true });
        return;
    }
    // Load channel → project
    const chR = await pool.query(`SELECT ch.config, p.*, p.project_key FROM channels ch
     JOIN projects p ON p.id = ch.project_id
     WHERE ch.id = $1 AND ch.kind = 'telegram' AND ch.status = 'active' LIMIT 1`, [channelId]);
    if (!chR.rowCount) {
        res.json({ ok: true });
        return;
    }
    const cfg = chR.rows[0].config;
    const project = normalizeProject(chR.rows[0]);
    const lang = update.message?.from?.language_code?.slice(0, 2) ?? project.language;
    // RAG pipeline
    const chunks = await retrieveChunks(project.id, text);
    let replyText;
    const llmText = await callLlm(project, text, chunks, lang).catch(() => null);
    if (llmText) {
        replyText = llmText;
    }
    else {
        const answer = composeAnswer(project, text, chunks, lang);
        replyText = answer.message;
    }
    // Send reply via Telegram
    await fetch(`https://api.telegram.org/bot${cfg.botToken}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: replyText }),
    });
    res.json({ ok: true });
}));
// ─── END V3 ENDPOINTS ─────────────────────────────────────────────────────────
app.use((error, _req, res, _next) => {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[chat-api] unhandled error", error);
    res.status(500).json({ code: "INTERNAL_ERROR", message });
});
if (process.env["CHAT_API_DISABLE_LISTEN"] !== "true") {
    app.listen(env.PORT, () => {
        console.log(`chat-api listening on http://localhost:${env.PORT}`);
    });
}
export { app, env, pool };
