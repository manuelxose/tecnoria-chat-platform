import { z } from "zod";

const envSchema = z.object({
  CHAT_API_BASE_URL: z.string().url().default("http://localhost:4101"),
  CHAT_ADMIN_BEARER_TOKEN: z.string().min(1),
  DEFAULT_SITE_URL: z.string().url().default("https://talkaris.com"),
  DEFAULT_LEAD_WEBHOOK_URL: z.string().url().default("http://localhost:3001/api/v1/contact"),
});

const env = envSchema.parse(process.env);

function parseArgs(argv: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      continue;
    }
    const key = token.slice(2);
    const value = argv[index + 1] && !argv[index + 1].startsWith("--") ? argv[index + 1] : "true";
    result[key] = value;
  }
  return result;
}

async function adminFetch(path: string, init: RequestInit = {}): Promise<any> {
  const response = await fetch(`${env.CHAT_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${env.CHAT_ADMIN_BEARER_TOKEN}`,
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${JSON.stringify(body)}`);
  }
  return body;
}

async function createProject(args: Record<string, string>): Promise<void> {
  const publicSiteUrl = args.siteUrl ?? env.DEFAULT_SITE_URL;
  const payload = {
    projectKey: args.key,
    name: args.name,
    tenantSlug: args.tenant ?? "platform-default",
    siteKey: args.siteKey ?? "talkaris-public-site-key",
    allowedDomains: (args.domains ?? "talkaris.com,www.talkaris.com").split(",").filter(Boolean),
    botName: args.botName ?? "Talkaris Assistant",
    welcomeMessage:
      args.welcome ?? "Hola. Soy el asistente de Talkaris. Puedo ayudarte con la plataforma, sus integraciones, seguridad y acceso comercial.",
    ctaConfig: {
      primaryLabel: "Solicitar demo",
      primaryUrl: `${publicSiteUrl}/solicitar-acceso`,
      secondaryLabel: "Ver funcionalidades",
      secondaryUrl: `${publicSiteUrl}/funcionalidades`,
      salesKeywords: ["precio", "presupuesto", "contacto", "demo", "reunion", "chatbot"],
    },
    leadSink: {
      mode: "webhook",
      webhookUrl: args.leadWebhook ?? env.DEFAULT_LEAD_WEBHOOK_URL,
      secretHeaderName: "x-talkaris-chat-secret",
    },
  };
  const data = await adminFetch("/v1/admin/projects", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  console.log(JSON.stringify(data, null, 2));
}

async function createTenant(args: Record<string, string>): Promise<void> {
  const payload = {
    slug: args.slug,
    name: args.name,
    brandName: args.brandName ?? args.name,
    publicBaseUrl: args.publicBaseUrl,
    metadata: args.metadata ? JSON.parse(args.metadata) : {},
  };
  const data = await adminFetch("/v1/admin/tenants", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  console.log(JSON.stringify(data, null, 2));
}

async function upsertSource(args: Record<string, string>): Promise<void> {
  const payload = {
    projectKey: args.project,
    sourceKey: args.source ?? "public-web",
    kind: args.kind ?? "sitemap",
    entryUrl: args.entry ?? `${env.DEFAULT_SITE_URL}/sitemap.xml`,
    includePatterns: args.include ? args.include.split(",").filter(Boolean) : [],
    excludePatterns: args.exclude ? args.exclude.split(",").filter(Boolean) : ["/privacidad", "/politica-de-privacidad"],
    allowedDomains: (args.domains ?? "talkaris.com,www.talkaris.com").split(",").filter(Boolean),
    visibility: args.visibility ?? "public",
    defaultCategory: args.category ?? "corporativo",
  };
  const data = await adminFetch("/v1/admin/sources", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  console.log(JSON.stringify(data, null, 2));
}

async function queueIngestion(args: Record<string, string>): Promise<void> {
  const data = await adminFetch("/v1/admin/ingestions", {
    method: "POST",
    body: JSON.stringify({
      projectKey: args.project,
      sourceKey: args.source ?? "public-web",
      requestedBy: args.by ?? "ops-cli",
    }),
  });
  console.log(JSON.stringify(data, null, 2));
}

async function analyticsSummary(args: Record<string, string>): Promise<void> {
  const data = await adminFetch(`/v1/admin/analytics/summary?projectKey=${encodeURIComponent(args.project)}`);
  console.log(JSON.stringify(data, null, 2));
}

async function runEval(args: Record<string, string>): Promise<void> {
  const data = await adminFetch("/v1/admin/evals", {
    method: "POST",
    body: JSON.stringify({ projectKey: args.project }),
  });
  console.log(JSON.stringify(data, null, 2));
}

async function seedTalkaris(args: Record<string, string>): Promise<void> {
  await createTenant({
    slug: args.tenant ?? "platform-default",
    name: args.tenantName ?? "Talkaris Platform",
    brandName: args.brandName ?? "Talkaris",
  });
  await createProject({
    key: args.key ?? "talkaris",
    name: args.name ?? "Talkaris Demo",
    tenant: args.tenant ?? "platform-default",
    domains: args.domains ?? "talkaris.com,www.talkaris.com",
    leadWebhook: args.leadWebhook ?? env.DEFAULT_LEAD_WEBHOOK_URL,
    siteKey: args.siteKey ?? "talkaris-public-site-key",
    siteUrl: args.siteUrl ?? env.DEFAULT_SITE_URL,
  });
  await upsertSource({
    project: args.key ?? "talkaris",
    source: args.source ?? "public-web",
    kind: "sitemap",
    entry: args.entry ?? `${env.DEFAULT_SITE_URL}/sitemap.xml`,
    domains: args.domains ?? "talkaris.com,www.talkaris.com",
    exclude: args.exclude ?? "/politica-de-privacidad",
  });
  await queueIngestion({
    project: args.key ?? "talkaris",
    source: args.source ?? "public-web",
  });
}

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);

  switch (command) {
    case "create-tenant":
      await createTenant(args);
      break;
    case "create-project":
      await createProject(args);
      break;
    case "upsert-source":
      await upsertSource(args);
      break;
    case "queue-ingestion":
      await queueIngestion(args);
      break;
    case "analytics-summary":
      await analyticsSummary(args);
      break;
    case "run-eval":
      await runEval(args);
      break;
    case "seed-talkaris":
      await seedTalkaris(args);
      break;
    case "seed-tecnoria":
      await seedTalkaris(args);
      break;
    default:
      console.log(`Unknown command: ${command ?? ""}`);
      console.log("Commands: create-tenant, create-project, upsert-source, queue-ingestion, analytics-summary, run-eval, seed-talkaris, seed-tecnoria");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
