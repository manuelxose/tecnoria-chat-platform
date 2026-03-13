import { Routes } from "@angular/router";

export const routes: Routes = [
  // ============================================================
  // PUBLIC MARKETING ROUTES — Spanish
  // ============================================================
  {
    path: "",
    loadComponent: () =>
      import("./pages/public-page.component").then((m) => m.PublicPageComponent),
    data: { pageKey: "home", locale: "es" },
    pathMatch: "full",
  },
  {
    path: "funcionalidades",
    loadComponent: () =>
      import("./pages/public-page.component").then((m) => m.PublicPageComponent),
    data: { pageKey: "features", locale: "es" },
  },
  {
    path: "integraciones",
    loadComponent: () =>
      import("./pages/public-page.component").then((m) => m.PublicPageComponent),
    data: { pageKey: "integrations", locale: "es" },
  },
  {
    path: "casos-de-uso",
    loadComponent: () =>
      import("./pages/public-page.component").then((m) => m.PublicPageComponent),
    data: { pageKey: "use-cases", locale: "es" },
  },
  {
    path: "blog",
    loadComponent: () =>
      import("./pages/blog-list-page.component").then((m) => m.BlogListPageComponent),
    data: { locale: "es" },
  },
  {
    path: "blog/:slug",
    loadComponent: () =>
      import("./pages/blog-article-page.component").then((m) => m.BlogArticlePageComponent),
    data: { locale: "es" },
  },
  {
    path: "faq",
    loadComponent: () =>
      import("./pages/public-page.component").then((m) => m.PublicPageComponent),
    data: { pageKey: "faq", locale: "es" },
  },
  {
    path: "precios",
    loadComponent: () =>
      import("./pages/pricing-page.component").then((m) => m.PricingPageComponent),
    data: { locale: "es" },
  },
  {
    path: "clientes",
    loadComponent: () =>
      import("./pages/customers-page.component").then((m) => m.CustomersPageComponent),
    data: { locale: "es" },
  },

  // ============================================================
  // PUBLIC MARKETING ROUTES — English
  // ============================================================
  {
    path: "en",
    loadComponent: () =>
      import("./pages/public-page.component").then((m) => m.PublicPageComponent),
    data: { pageKey: "home", locale: "en" },
    pathMatch: "full",
  },
  {
    path: "en/features",
    loadComponent: () =>
      import("./pages/public-page.component").then((m) => m.PublicPageComponent),
    data: { pageKey: "features", locale: "en" },
  },
  {
    path: "en/integrations",
    loadComponent: () =>
      import("./pages/public-page.component").then((m) => m.PublicPageComponent),
    data: { pageKey: "integrations", locale: "en" },
  },
  {
    path: "en/use-cases",
    loadComponent: () =>
      import("./pages/public-page.component").then((m) => m.PublicPageComponent),
    data: { pageKey: "use-cases", locale: "en" },
  },
  {
    path: "en/blog",
    loadComponent: () =>
      import("./pages/blog-list-page.component").then((m) => m.BlogListPageComponent),
    data: { locale: "en" },
  },
  {
    path: "en/blog/:slug",
    loadComponent: () =>
      import("./pages/blog-article-page.component").then((m) => m.BlogArticlePageComponent),
    data: { locale: "en" },
  },
  {
    path: "en/faq",
    loadComponent: () =>
      import("./pages/public-page.component").then((m) => m.PublicPageComponent),
    data: { pageKey: "faq", locale: "en" },
  },
  {
    path: "en/pricing",
    loadComponent: () =>
      import("./pages/pricing-page.component").then((m) => m.PricingPageComponent),
    data: { locale: "en" },
  },
  {
    path: "en/customers",
    loadComponent: () =>
      import("./pages/customers-page.component").then((m) => m.CustomersPageComponent),
    data: { locale: "en" },
  },

  // ============================================================
  // ACCESS REQUEST / DEMO
  // ============================================================
  {
    path: "solicitar-demo",
    loadComponent: () =>
      import("./pages/access-request-page.component").then((m) => m.AccessRequestPageComponent),
    data: { locale: "es" },
  },
  {
    path: "en/request-demo",
    loadComponent: () =>
      import("./pages/access-request-page.component").then((m) => m.AccessRequestPageComponent),
    data: { locale: "en" },
  },
  { path: "solicitar-acceso", redirectTo: "solicitar-demo", pathMatch: "full" },
  { path: "en/request-access", redirectTo: "en/request-demo", pathMatch: "full" },

  // ============================================================
  // AUTH
  // ============================================================
  {
    path: "login",
    loadComponent: () =>
      import("./pages/login-page.component").then((m) => m.LoginPageComponent),
  },
  {
    path: "reset-password",
    loadComponent: () =>
      import("./pages/reset-password-page.component").then((m) => m.ResetPasswordPageComponent),
  },

  // ============================================================
  // TENANT COCKPIT — /app/*
  // ============================================================
  {
    path: "app",
    loadComponent: () =>
      import("./cockpit/shell/cockpit-shell.component").then((m) => m.CockpitShellComponent),
    children: [
      { path: "", redirectTo: "dashboard", pathMatch: "full" },
      {
        path: "dashboard",
        loadComponent: () =>
          import("./cockpit/dashboard/dashboard.component").then((m) => m.DashboardComponent),
      },
      // Bots
      {
        path: "bots",
        loadComponent: () =>
          import("./cockpit/bots/bots-list.component").then((m) => m.BotsListComponent),
      },
      {
        path: "bots/new",
        loadComponent: () =>
          import("./cockpit/bots/bot-builder.component").then((m) => m.BotBuilderComponent),
      },
      {
        path: "bots/:botKey",
        loadComponent: () =>
          import("./cockpit/bots/bot-builder.component").then((m) => m.BotBuilderComponent),
      },
      {
        path: "bots/:botKey/test",
        loadComponent: () =>
          import("./cockpit/bots/bot-test.component").then((m) => m.BotTestComponent),
      },
      {
        path: "deployments",
        loadComponent: () =>
          import("./cockpit/bots/bot-deployments.component").then((m) => m.BotDeploymentsComponent),
      },
      // Conversations
      {
        path: "conversations",
        loadComponent: () =>
          import("./cockpit/conversations/conversations.component").then((m) => m.ConversationsComponent),
      },
      {
        path: "conversations/live",
        loadComponent: () =>
          import("./cockpit/conversations/handover-queue.component").then((m) => m.HandoverQueueComponent),
      },
      {
        path: "conversations/:id",
        loadComponent: () =>
          import("./cockpit/conversations/conversation-detail.component").then((m) => m.ConversationDetailComponent),
      },
      // Knowledge
      {
        path: "knowledge",
        loadComponent: () =>
          import("./cockpit/knowledge/knowledge-sources.component").then((m) => m.KnowledgeSourcesComponent),
      },
      {
        path: "knowledge/documents",
        loadComponent: () =>
          import("./cockpit/knowledge/knowledge-documents.component").then((m) => m.KnowledgeDocumentsComponent),
      },
      {
        path: "knowledge/ingestions",
        loadComponent: () =>
          import("./cockpit/knowledge/knowledge-ingestions.component").then((m) => m.KnowledgeIngestionComponent),
      },
      {
        path: "knowledge/schedules",
        loadComponent: () =>
          import("./cockpit/knowledge/knowledge-schedules.component").then((m) => m.KnowledgeSchedulesComponent),
      },
      // Analytics
      {
        path: "analytics",
        loadComponent: () =>
          import("./cockpit/analytics/analytics.component").then((m) => m.AnalyticsComponent),
      },
      // Channels (V3-D)
      {
        path: "channels",
        loadComponent: () =>
          import("./cockpit/channels/channels.component").then((m) => m.ChannelsComponent),
      },
      // Leads
      {
        path: "leads",
        loadComponent: () =>
          import("./cockpit/leads/leads.component").then((m) => m.LeadsComponent),
      },
      // Developers
      {
        path: "developers",
        loadComponent: () =>
          import("./cockpit/developers/developers.component").then((m) => m.DevelopersComponent),
      },
      // Settings
      {
        path: "settings",
        loadComponent: () =>
          import("./cockpit/settings/settings.component").then((m) => m.SettingsComponent),
      },
      {
        path: "settings/members",
        loadComponent: () =>
          import("./cockpit/settings/members.component").then((m) => m.MembersComponent),
      },
      {
        path: "settings/api-keys",
        loadComponent: () =>
          import("./cockpit/settings/api-keys.component").then((m) => m.ApiKeysComponent),
      },
      {
        path: "settings/webhooks",
        loadComponent: () =>
          import("./cockpit/settings/webhooks.component").then((m) => m.WebhooksComponent),
      },
      {
        path: "settings/notifications",
        loadComponent: () =>
          import("./cockpit/settings/notifications.component").then((m) => m.NotificationsComponent),
      },
      { path: "**", redirectTo: "dashboard" },
    ],
  },

  // ============================================================
  // SUPERADMIN COCKPIT — /admin/*
  // ============================================================
  {
    path: "admin",
    loadComponent: () =>
      import("./cockpit/admin/admin-shell.component").then((m) => m.AdminShellComponent),
    children: [
      { path: "", redirectTo: "overview", pathMatch: "full" },
      {
        path: "overview",
        loadComponent: () =>
          import("./cockpit/admin/admin-overview.component").then((m) => m.AdminOverviewComponent),
      },
      {
        path: "requests",
        loadComponent: () =>
          import("./cockpit/admin/admin-requests.component").then((m) => m.AdminRequestsComponent),
      },
      {
        path: "tenants",
        loadComponent: () =>
          import("./cockpit/admin/admin-tenants.component").then((m) => m.AdminTenantsComponent),
      },
      {
        path: "users",
        loadComponent: () =>
          import("./cockpit/admin/admin-users.component").then((m) => m.AdminUsersComponent),
      },
      {
        path: "platform",
        loadComponent: () =>
          import("./cockpit/admin/admin-platform.component").then((m) => m.AdminPlatformComponent),
      },
      { path: "**", redirectTo: "overview" },
    ],
  },

  // ============================================================
  // FALLBACK
  // ============================================================
  { path: "**", redirectTo: "" },
];
