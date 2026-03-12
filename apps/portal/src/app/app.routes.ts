import { Routes } from "@angular/router";

export const routes: Routes = [
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
  {
    path: "solicitar-acceso",
    redirectTo: "solicitar-demo",
    pathMatch: "full",
  },
  {
    path: "en/request-access",
    redirectTo: "en/request-demo",
    pathMatch: "full",
  },
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
  {
    path: "app",
    loadComponent: () =>
      import("./pages/tenant-dashboard-page.component").then((m) => m.TenantDashboardPageComponent),
  },
  {
    path: "admin",
    loadComponent: () =>
      import("./pages/superadmin-page.component").then((m) => m.SuperadminPageComponent),
  },
  {
    path: "**",
    redirectTo: "",
  },
];
