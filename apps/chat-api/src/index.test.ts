import assert from "node:assert/strict";
import test from "node:test";

process.env.CHAT_API_DISABLE_LISTEN = "true";
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgres://postgres:postgres@127.0.0.1:5434/tecnoria_chat";
process.env.ADMIN_BEARER_TOKEN = process.env.ADMIN_BEARER_TOKEN || "test-admin-token";
process.env.LEAD_WEBHOOK_SHARED_SECRET = process.env.LEAD_WEBHOOK_SHARED_SECRET || "test-webhook-secret";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-with-enough-length";

const mod = await import("./index.js");

test("buildLooseTsQuery keeps relevant tokens and removes stop words", () => {
  assert.equal(mod.buildLooseTsQuery("Como se integra el chatbot para ventas"), "integra | chatbot | ventas");
});

test("slugify produces stable slugs", () => {
  assert.equal(mod.slugify("Cliente Demo Espana"), "cliente-demo-espana");
});

test("buildWidgetSnippet emits the expected embed contract", () => {
  const snippet = mod.buildWidgetSnippet(
    {
      id: "default",
      brandName: "Portal Chat",
      legalName: "Portal Chat Legal",
      tagline: "tagline",
      summary: "summary",
      supportEmail: "ops@example.com",
      websiteUrl: "https://example.com",
      productDomain: "chat.example.com",
      portalBaseUrl: "https://chat.example.com",
      apiBaseUrl: "https://chat.example.com/api",
      widgetBaseUrl: "https://chat.example.com/widget/",
      developedBy: "Tecnoria",
      demoProjectKey: "demo",
      demoSiteKey: "demo-site-key",
      defaultLocale: "es",
      supportedLocales: ["es", "en"],
      seoTitle: "Portal Chat",
      seoDescription: "summary",
      seoKeywords: ["portal", "chat"],
      seoImageUrl: "https://chat.example.com/og.svg",
      organizationName: "Portal Chat",
      contactEmail: "ops@example.com",
      heroPoints: [],
      featureFlags: {},
    },
    {
      id: "project-1",
      tenantId: "tenant-1",
      projectKey: "demo",
      name: "Demo",
      siteKey: "demo-site-key",
      status: "active",
      publicBaseUrl: "https://chat.example.com",
      metadata: {},
      language: "es",
      allowedDomains: [],
      botName: "Asistente",
      welcomeMessage: "Hola",
      promptPolicy: {
        tone: "neutral",
        outOfScopeMessage: "nope",
        guardrails: [],
        disallowPricing: true,
      },
      ctaConfig: {
        primaryLabel: "CTA",
        primaryUrl: "https://example.com/contacto",
        salesKeywords: [],
      },
      widgetTheme: {
        accentColor: "#000000",
        surfaceColor: "#111111",
        textColor: "#ffffff",
        launcherLabel: "Hablar",
      },
      leadSink: {
        mode: "webhook",
        webhookUrl: "https://example.com/webhook",
        secretHeaderName: "x-secret",
      },
    }
  );

  assert.match(snippet, /TalkarisWidgetConfig/);
  assert.match(snippet, /ChatPortalWidgetConfig = window.TalkarisWidgetConfig/);
  assert.match(snippet, /demo-site-key/);
  assert.match(snippet, /https:\/\/chat\.example\.com\/api/);
});
