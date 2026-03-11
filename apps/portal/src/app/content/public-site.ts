import { PortalSettings } from "../core/models";

export type PublicLocale = "es" | "en";
export type PublicPageKey = "home" | "features" | "integrations" | "use-cases" | "blog" | "faq";

export interface PublicPageSection {
  eyebrow: string;
  title: string;
  body: string;
  bullets?: string[];
}

export interface FaqEntry {
  question: string;
  answer: string;
}

export interface PublicPageDefinition {
  key: PublicPageKey;
  locale: PublicLocale;
  path: string;
  navLabel: string;
  eyebrow: string;
  title: string;
  description: string;
  heroTitle: string;
  heroCopy: string;
  heroSummary: string;
  primaryCtaLabel: string;
  primaryCtaPath: string;
  secondaryCtaLabel: string;
  secondaryCtaPath: string;
  indexable: boolean;
  sections: PublicPageSection[];
  faqs?: FaqEntry[];
}

export const DEFAULT_PORTAL_SETTINGS: PortalSettings = {
  brandName: "Talkaris",
  legalName: "Talkaris",
  tagline: "AI chat infrastructure for websites, products and operations.",
  summary: "Talkaris centralises public demo, embeddable widget, tenant operations and superadmin control in one platform.",
  supportEmail: "hello@talkaris.com",
  websiteUrl: "https://talkaris.com",
  productDomain: "talkaris.com",
  portalBaseUrl: "https://talkaris.com",
  apiBaseUrl: "https://talkaris.com/api",
  widgetBaseUrl: "https://talkaris.com/widget/",
  developedBy: "Tecnoria",
  demoProjectKey: "talkaris",
  demoSiteKey: "talkaris-public-site-key",
  defaultLocale: "es",
  supportedLocales: ["es", "en"],
  seoTitle: "Talkaris | AI chat platform for websites and products",
  seoDescription: "Talkaris is the conversational AI platform for websites and applications, with embeddable widget, tenant console and central governance.",
  seoKeywords: ["ai chat platform", "chat widget", "multi tenant chatbot", "customer support ai", "talkaris"],
  seoImageUrl: "https://talkaris.com/assets/talkaris-social-card.svg",
  organizationName: "Talkaris",
  contactEmail: "hello@talkaris.com",
  heroPoints: [
    "Public landing with live widget demo",
    "Independent tenant consoles by client or product",
    "Central superadmin governance",
  ],
  featureFlags: {
    publicAccessRequests: true,
    tenantConsole: true,
    superadmin: true,
    seoLanding: true,
  },
};

export const PUBLIC_PAGES: PublicPageDefinition[] = [
  {
    key: "home",
    locale: "es",
    path: "/",
    navLabel: "Inicio",
    eyebrow: "Plataforma de chat IA",
    title: "Talkaris",
    description: "Plataforma conversacional para websites y productos con widget embebible, panel tenant y gobierno centralizado.",
    heroTitle: "Convierte tu web o producto en una experiencia conversacional operable.",
    heroCopy: "Talkaris unifica demo pública, widget, integraciones, tenants y control superadmin en una sola plataforma.",
    heroSummary: "Diseñada para desplegar asistentes IA en varias aplicaciones sin mezclar conocimiento, analítica ni operación.",
    primaryCtaLabel: "Solicitar acceso",
    primaryCtaPath: "/solicitar-acceso",
    secondaryCtaLabel: "Ver funcionalidades",
    secondaryCtaPath: "/funcionalidades",
    indexable: true,
    sections: [
      {
        eyebrow: "Producto",
        title: "Widget embebible con branding y CTA por integración",
        body: "Cada proyecto mantiene su nombre, mensaje de bienvenida, dominios permitidos, CTA comercial y tema visual.",
      },
      {
        eyebrow: "Operación",
        title: "Tenant console real para fuentes, ingestas y analítica",
        body: "Gestiona proyectos, contenido ingerido, conversaciones, leads y snippet de integración sin depender del equipo central.",
      },
      {
        eyebrow: "Gobierno",
        title: "Superadmin global para accesos, tenants y salud de plataforma",
        body: "El equipo central controla branding, solicitudes de acceso, usuarios, membresías y visión cross-tenant.",
      },
    ],
  },
  {
    key: "features",
    locale: "es",
    path: "/funcionalidades",
    navLabel: "Funcionalidades",
    eyebrow: "Funcionalidades",
    title: "Funcionalidades de Talkaris",
    description: "Conoce las capacidades de Talkaris para widget, contenido, analítica, leads y administración multi-tenant.",
    heroTitle: "Todo lo necesario para operar asistentes IA embebidos.",
    heroCopy: "Talkaris no se queda en un chat bonito: cubre integración, contenido, observación y gobierno.",
    heroSummary: "El producto combina experiencia pública, panel operativo y control global en una misma arquitectura.",
    primaryCtaLabel: "Solicitar demo",
    primaryCtaPath: "/solicitar-acceso",
    secondaryCtaLabel: "Ver integraciones",
    secondaryCtaPath: "/integraciones",
    indexable: true,
    sections: [
      {
        eyebrow: "Widget",
        title: "Embed asíncrono y configuración por site key",
        body: "El snippet carga el iframe del widget, resuelve configuración desde API y respeta branding por proyecto.",
        bullets: ["CTA condicional", "Leads integrados", "Dominios permitidos", "Tema visual por proyecto"],
      },
      {
        eyebrow: "Conocimiento",
        title: "Sitemap, HTML y documentación versionada",
        body: "Las fuentes permiten ingesta controlada, reindexación y lectura operativa de documentos y versiones.",
      },
      {
        eyebrow: "Administración",
        title: "Separación por tenant y proyecto",
        body: "Cada aplicación integrada opera de forma aislada, mientras superadmin conserva visión global.",
      },
    ],
  },
  {
    key: "integrations",
    locale: "es",
    path: "/integraciones",
    navLabel: "Integraciones",
    eyebrow: "Integraciones",
    title: "Integraciones de Talkaris",
    description: "Integra Talkaris en webs corporativas, productos SaaS, portales privados y soportes documentales.",
    heroTitle: "Una plataforma conversacional preparada para varios contextos de integración.",
    heroCopy: "Talkaris se integra por snippet, site key y dominios permitidos, sin acoplar el producto al portal público.",
    heroSummary: "La misma infraestructura sirve para marketing, soporte, onboarding, documentación o captación de leads.",
    primaryCtaLabel: "Hablar con Talkaris",
    primaryCtaPath: "/solicitar-acceso",
    secondaryCtaLabel: "Ver casos de uso",
    secondaryCtaPath: "/casos-de-uso",
    indexable: true,
    sections: [
      {
        eyebrow: "Web pública",
        title: "Landing comercial con demo embebida",
        body: "La home de Talkaris incorpora un widget demo con branding propio y CTA orientado a demo o acceso.",
      },
      {
        eyebrow: "Producto",
        title: "SaaS, extranets y portales operativos",
        body: "Cada integración puede vivir en su propia aplicación y seguir gestionándose desde el mismo tenant.",
      },
      {
        eyebrow: "Ecosistema",
        title: "APIs y webhook de leads",
        body: "El panel genera snippet y la API mantiene endpoints operativos para widget, leads, analytics e ingestas.",
      },
    ],
  },
  {
    key: "use-cases",
    locale: "es",
    path: "/casos-de-uso",
    navLabel: "Casos de uso",
    eyebrow: "Casos de uso",
    title: "Casos de uso de Talkaris",
    description: "Descubre cómo usar Talkaris para soporte, preventa, documentación, onboarding y gobierno multi-aplicación.",
    heroTitle: "Del primer contacto comercial a la operación diaria.",
    heroCopy: "Talkaris sirve para captar demanda, responder dudas frecuentes y abrir conversaciones útiles en distintos productos.",
    heroSummary: "Cada caso de uso puede apoyarse en conocimiento propio, CTA y analítica independiente por proyecto.",
    primaryCtaLabel: "Solicitar acceso",
    primaryCtaPath: "/solicitar-acceso",
    secondaryCtaLabel: "FAQ",
    secondaryCtaPath: "/faq",
    indexable: true,
    sections: [
      {
        eyebrow: "Preventa",
        title: "Respuesta comercial con CTA y captura de lead",
        body: "El widget identifica intención comercial y deriva a demo, contacto o formulario sin perder contexto.",
      },
      {
        eyebrow: "Soporte",
        title: "Documentación y ayuda contextual",
        body: "Los proyectos pueden ingerir sitemap, HTML o PDF y responder solo con el conocimiento autorizado.",
      },
      {
        eyebrow: "Gobierno",
        title: "Varias marcas o varias aplicaciones",
        body: "Un tenant puede operar múltiples proyectos con aislamiento claro de dominios, analítica y conversaciones.",
      },
    ],
  },
  {
    key: "faq",
    locale: "es",
    path: "/faq",
    navLabel: "FAQ",
    eyebrow: "Preguntas frecuentes",
    title: "FAQ de Talkaris",
    description: "Respuestas rápidas sobre integración, multi-tenant, seguridad, contenidos y despliegue de Talkaris.",
    heroTitle: "Preguntas frecuentes sobre la plataforma.",
    heroCopy: "Una vista rápida para entender cómo se integra y gobierna Talkaris.",
    heroSummary: "Si necesitas una revisión más específica, el flujo recomendado es solicitar acceso o una demo.",
    primaryCtaLabel: "Solicitar demo",
    primaryCtaPath: "/solicitar-acceso",
    secondaryCtaLabel: "Volver al inicio",
    secondaryCtaPath: "/",
    indexable: true,
    sections: [
      {
        eyebrow: "FAQ",
        title: "Lo esencial sobre Talkaris",
        body: "Estas respuestas resumen el alcance actual del producto y su forma de integración.",
      },
    ],
    faqs: [
      {
        question: "¿Cómo se integra Talkaris en una aplicación?",
        answer: "Mediante snippet del widget, site key por proyecto y dominios permitidos. La gestión operativa se hace desde tenant console.",
      },
      {
        question: "¿Se puede usar en varias aplicaciones a la vez?",
        answer: "Sí. Un mismo tenant puede gestionar varios proyectos integrados, cada uno con su contenido y configuración independientes.",
      },
      {
        question: "¿Qué contenido puede ingerir?",
        answer: "Sitemap, HTML público, PDF y markdown a través de fuentes gestionadas desde la consola.",
      },
      {
        question: "¿Quién controla accesos y configuración global?",
        answer: "El área superadmin revisa solicitudes, crea tenants, asigna memberships y administra branding y dominio del producto.",
      },
    ],
  },
  {
    key: "blog",
    locale: "es",
    path: "/blog",
    navLabel: "Blog",
    eyebrow: "Blog",
    title: "Blog de Talkaris",
    description: "Artículos sobre operaciones de conocimiento, chatbots, integraciones y gobierno conversacional para equipos de producto.",
    heroTitle: "Contenido operativo para equipos que despliegan IA conversacional.",
    heroCopy: "El blog de Talkaris reúne guías, comparativas, casos de uso y notas de producto orientadas a equipos técnicos y de operaciones.",
    heroSummary: "Cada artículo se publica desde Auctorio y se reingiere en la base de conocimiento pública de Talkaris.",
    primaryCtaLabel: "Solicitar acceso",
    primaryCtaPath: "/solicitar-acceso",
    secondaryCtaLabel: "Ver funcionalidades",
    secondaryCtaPath: "/funcionalidades",
    indexable: true,
    sections: [
      {
        eyebrow: "Contenido",
        title: "Guías y casos de uso orientados a operación",
        body: "Talkaris publica piezas que explican integración, gobierno, soporte, conocimiento y automatización conversacional.",
      },
    ],
  },
  {
    key: "home",
    locale: "en",
    path: "/en",
    navLabel: "Home",
    eyebrow: "AI chat platform",
    title: "Talkaris",
    description: "Conversational AI platform for websites and products, with embeddable widget, tenant console and central governance.",
    heroTitle: "Turn every website or product into an operable conversational experience.",
    heroCopy: "Talkaris brings together public demo, widget, integrations, tenant operations and superadmin governance in one platform.",
    heroSummary: "Built to deploy AI assistants across multiple applications without mixing knowledge, analytics or operations.",
    primaryCtaLabel: "Request access",
    primaryCtaPath: "/en/request-access",
    secondaryCtaLabel: "See features",
    secondaryCtaPath: "/en/features",
    indexable: true,
    sections: [
      {
        eyebrow: "Product",
        title: "Embeddable widget with branding and CTA per integration",
        body: "Every project keeps its own bot name, welcome message, allowed domains, commercial CTA and visual theme.",
      },
      {
        eyebrow: "Operations",
        title: "Real tenant console for sources, ingestions and analytics",
        body: "Manage projects, indexed content, conversations, leads and integration snippets without routing everything through the central team.",
      },
      {
        eyebrow: "Governance",
        title: "Global superadmin for access, tenants and platform health",
        body: "The core team controls branding, access requests, users, memberships and cross-tenant visibility.",
      },
    ],
  },
  {
    key: "features",
    locale: "en",
    path: "/en/features",
    navLabel: "Features",
    eyebrow: "Features",
    title: "Talkaris features",
    description: "Explore Talkaris capabilities for widgets, content ingestion, analytics, leads and multi-tenant administration.",
    heroTitle: "Everything required to run embedded AI assistants.",
    heroCopy: "Talkaris goes beyond a chat box: it covers integration, content, analytics and governance.",
    heroSummary: "The product combines public experience, operational workspace and global control in one architecture.",
    primaryCtaLabel: "Request demo",
    primaryCtaPath: "/en/request-access",
    secondaryCtaLabel: "See integrations",
    secondaryCtaPath: "/en/integrations",
    indexable: true,
    sections: [
      {
        eyebrow: "Widget",
        title: "Async embed and site-key based configuration",
        body: "The snippet loads the widget iframe, resolves configuration from the API and respects project-level branding.",
      },
      {
        eyebrow: "Knowledge",
        title: "Sitemap, HTML and versioned documents",
        body: "Sources enable controlled ingestion, re-indexing and operational document visibility.",
      },
      {
        eyebrow: "Administration",
        title: "Tenant and project isolation",
        body: "Each integrated application operates independently while superadmin keeps a global view.",
      },
    ],
  },
  {
    key: "integrations",
    locale: "en",
    path: "/en/integrations",
    navLabel: "Integrations",
    eyebrow: "Integrations",
    title: "Talkaris integrations",
    description: "Integrate Talkaris into corporate websites, SaaS products, private portals and document-driven support surfaces.",
    heroTitle: "A conversational platform ready for multiple integration contexts.",
    heroCopy: "Talkaris integrates through snippet, site key and allowed domains, without coupling the product to the public portal.",
    heroSummary: "The same infrastructure works for marketing, support, onboarding, documentation or lead capture.",
    primaryCtaLabel: "Talk to Talkaris",
    primaryCtaPath: "/en/request-access",
    secondaryCtaLabel: "See use cases",
    secondaryCtaPath: "/en/use-cases",
    indexable: true,
    sections: [
      {
        eyebrow: "Public web",
        title: "Commercial landing with embedded live demo",
        body: "Talkaris home can expose a branded live demo widget oriented to access requests and demos.",
      },
      {
        eyebrow: "Product",
        title: "SaaS, extranets and operational portals",
        body: "Every integration may live in its own application while still being managed from the same tenant.",
      },
      {
        eyebrow: "Ecosystem",
        title: "APIs and lead webhook",
        body: "The portal generates snippets and the API keeps operational endpoints for widget traffic, leads, analytics and ingestions.",
      },
    ],
  },
  {
    key: "use-cases",
    locale: "en",
    path: "/en/use-cases",
    navLabel: "Use cases",
    eyebrow: "Use cases",
    title: "Talkaris use cases",
    description: "See how to use Talkaris for support, pre-sales, documentation, onboarding and multi-application governance.",
    heroTitle: "From first commercial contact to day-to-day operations.",
    heroCopy: "Talkaris helps capture demand, answer recurring questions and open useful conversations across products.",
    heroSummary: "Every use case can rely on its own knowledge base, CTA and analytics by project.",
    primaryCtaLabel: "Request access",
    primaryCtaPath: "/en/request-access",
    secondaryCtaLabel: "FAQ",
    secondaryCtaPath: "/en/faq",
    indexable: true,
    sections: [
      {
        eyebrow: "Pre-sales",
        title: "Commercial response with CTA and lead capture",
        body: "The widget detects commercial intent and routes people to demo, contact or form without losing context.",
      },
      {
        eyebrow: "Support",
        title: "Documentation and contextual help",
        body: "Projects can ingest sitemap, HTML or PDF sources and answer only with authorised knowledge.",
      },
      {
        eyebrow: "Governance",
        title: "Multiple brands or multiple applications",
        body: "One tenant can operate many projects with clear isolation of domains, analytics and conversations.",
      },
    ],
  },
  {
    key: "blog",
    locale: "en",
    path: "/en/blog",
    navLabel: "Blog",
    eyebrow: "Blog",
    title: "Talkaris blog",
    description: "Articles on knowledge operations, AI chat integrations, governance and product workflows for teams shipping conversational systems.",
    heroTitle: "Operational content for teams running conversational AI.",
    heroCopy: "Talkaris blog covers integration patterns, product workflows, governance, support use cases and shipping guidance.",
    heroSummary: "Every article is published through Auctorio and re-ingested into Talkaris public knowledge.",
    primaryCtaLabel: "Request access",
    primaryCtaPath: "/en/request-access",
    secondaryCtaLabel: "See features",
    secondaryCtaPath: "/en/features",
    indexable: true,
    sections: [
      {
        eyebrow: "Editorial",
        title: "Guides and use cases grounded in operations",
        body: "Talkaris publishes product explainers, comparisons, integration notes and governance guidance for technical teams.",
      },
    ],
  },
  {
    key: "faq",
    locale: "en",
    path: "/en/faq",
    navLabel: "FAQ",
    eyebrow: "FAQ",
    title: "Talkaris FAQ",
    description: "Quick answers about integration, multi-tenant architecture, security, content ingestion and deployment.",
    heroTitle: "Frequently asked questions about Talkaris.",
    heroCopy: "A fast overview of how the platform is integrated and governed.",
    heroSummary: "For a deeper review, the recommended next step is to request access or a demo.",
    primaryCtaLabel: "Request demo",
    primaryCtaPath: "/en/request-access",
    secondaryCtaLabel: "Back to home",
    secondaryCtaPath: "/en",
    indexable: true,
    sections: [
      {
        eyebrow: "FAQ",
        title: "The essentials about Talkaris",
        body: "These answers summarise the current product scope and integration model.",
      },
    ],
    faqs: [
      {
        question: "How is Talkaris integrated into an application?",
        answer: "Through the widget snippet, a project-specific site key and allowed domains. Operational management lives in tenant console.",
      },
      {
        question: "Can it support multiple applications at once?",
        answer: "Yes. One tenant may manage several integrated projects, each with isolated content and configuration.",
      },
      {
        question: "What kind of content can it ingest?",
        answer: "Sitemap, public HTML, PDF and markdown through sources managed in the console.",
      },
      {
        question: "Who controls access and global configuration?",
        answer: "The superadmin area reviews requests, creates tenants, assigns memberships and manages product branding and domain settings.",
      },
    ],
  },
];

export function getPublicPageByPath(path: string): PublicPageDefinition | undefined {
  return PUBLIC_PAGES.find((page) => page.path === path);
}

export function getPublicPage(key: PublicPageKey, locale: PublicLocale): PublicPageDefinition {
  const page = PUBLIC_PAGES.find((candidate) => candidate.key === key && candidate.locale === locale);
  if (!page) {
    throw new Error(`Unknown public page: ${locale}:${key}`);
  }
  return page;
}

export function getAlternatePublicPage(page: PublicPageDefinition, locale: PublicLocale): PublicPageDefinition {
  return getPublicPage(page.key, locale);
}

export function getPublicNavigation(locale: PublicLocale): PublicPageDefinition[] {
  return PUBLIC_PAGES.filter((page) => page.locale === locale);
}
