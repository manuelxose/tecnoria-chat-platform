import { PortalSettings } from "../core/models";

export type PublicLocale = "es" | "en";
export type PublicPageKey = "home" | "features" | "integrations" | "use-cases" | "blog" | "faq" | "pricing" | "customers";

export interface PublicPageStat {
  value: string;
  label: string;
  detail: string;
}

export interface PublicPageCard {
  eyebrow?: string;
  title: string;
  body: string;
  bullets?: string[];
  metric?: string;
  authorName?: string;
  authorRole?: string;
  authorCompany?: string;
  rating?: number;
}

export interface PublicPageSection {
  id: string;
  eyebrow: string;
  title: string;
  intro: string;
  layout: "three-up" | "two-up" | "spotlight";
  type?: "cards" | "testimonials" | "logos" | "comparison" | "numbered";
  image?: string;
  imageAlt?: string;
  cards: PublicPageCard[];
}

export interface PublicTimelineStep {
  step: string;
  title: string;
  body: string;
}

export interface FaqEntry {
  question: string;
  answer: string;
}

export interface PublicCtaPanel {
  eyebrow: string;
  title: string;
  body: string;
  primaryLabel: string;
  primaryPath: string;
  secondaryLabel: string;
  secondaryPath: string;
}

export interface PublicPageDefinition {
  key: PublicPageKey;
  locale: PublicLocale;
  path: string;
  navLabel: string;
  breadcrumbLabel: string;
  title: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  heroEyebrow: string;
  heroTitle: string;
  heroCopy: string;
  heroSummary: string;
  heroBadges: string[];
  heroStats: PublicPageStat[];
  heroImage: string;
  heroImageAlt: string;
  primaryCtaLabel: string;
  primaryCtaPath: string;
  secondaryCtaLabel: string;
  secondaryCtaPath: string;
  indexable: boolean;
  leadInTitle: string;
  leadInBody: string;
  leadInProofs: string[];
  sections: PublicPageSection[];
  timelineTitle?: string;
  timelineIntro?: string;
  timeline?: PublicTimelineStep[];
  faqs?: FaqEntry[];
  ctaPanel: PublicCtaPanel;
}

export const DEFAULT_PORTAL_SETTINGS: PortalSettings = {
  brandName: "Talkaris",
  legalName: "Talkaris",
  tagline: "Conversational AI infrastructure for websites, products and support operations.",
  summary:
    "Talkaris centralises public demo, embeddable widget, knowledge ingestion, tenant operations and global governance in one platform.",
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
  seoTitle: "Talkaris | Plataforma de IA conversacional para webs, productos y soporte",
  seoDescription:
    "Plataforma de IA conversacional con widget embebible, base de conocimiento controlada, analítica de conversaciones y operación multi-tenant para equipos B2B.",
  seoKeywords: [
    "plataforma ia conversacional",
    "chatbot para web",
    "widget ia embebible",
    "asistente ia para soporte",
    "chatbot multitenant",
    "talkaris",
  ],
  seoImageUrl: "https://talkaris.com/assets/talkaris-social-card.svg",
  organizationName: "Talkaris",
  contactEmail: "hello@talkaris.com",
  heroPoints: [
    "Widget white-label listo para desplegar",
    "Conocimiento aislado por proyecto y tenant",
    "Operación comercial y soporte desde un solo stack",
  ],
  featureFlags: {
    publicAccessRequests: true,
    tenantConsole: true,
    superadmin: true,
    seoLanding: true,
  },
};

const HOME_ES: PublicPageDefinition = {
  key: "home",
  locale: "es",
  path: "/",
  navLabel: "Inicio",
  breadcrumbLabel: "Inicio",
  title: "Talkaris",
  description:
    "Plataforma de IA conversacional para empresas que necesitan captar demanda, asistir usuarios y operar asistentes embebidos sin improvisar.",
  seoTitle: "Talkaris | Plataforma de IA conversacional para webs, SaaS y soporte",
  seoDescription:
    "Convierte tu web, producto o portal en una experiencia conversacional seria: widget embebible, base de conocimiento controlada, leads y gobierno multi-tenant.",
  seoKeywords: [
    "plataforma ia conversacional",
    "chatbot ia para empresas",
    "widget chatbot embebible",
    "asistente ia para saas",
    "chatbot para soporte y ventas",
    "chatbot para web b2b",
    "asistente ia soporte cliente",
    "widget chat inteligente",
    "plataforma rag empresa",
    "chatbot multimodal",
    "alternativa intercom ia",
  ],
  heroEyebrow: "Infraestructura de IA conversacional",
  heroTitle: "Despliega un asistente de IA que trabaja de verdad. Widget, conocimiento y analítica en un stack.",
  heroCopy:
    "Talkaris unifica widget embebible, conocimiento controlado, analítica conversacional y operación multi-tenant para que tu equipo lance experiencias útiles, no demos vacías.",
  heroSummary:
    "Pensado para equipos B2B que necesitan claridad comercial, gobierno técnico y una capa pública capaz de convertir desde el primer scroll.",
  heroBadges: ["Widget white-label", "Base de conocimiento gobernada", "Operación multi-proyecto"],
  heroStats: [
    {
      value: "< 5 min",
      label: "Tiempo hasta primer widget activo",
      detail: "Snippet + site key, sin dependencias de build.",
    },
    {
      value: "100%",
      label: "Conocimiento bajo tu control",
      detail: "Ningún dato sale de tu arquitectura sin tu permiso.",
    },
    {
      value: "Multi-LLM",
      label: "OpenAI, Anthropic, DeepSeek, Gemini",
      detail: "Cambia de modelo sin tocar la integración.",
    },
  ],
  heroImage: "/assets/talkaris-hero-campaign.png",
  heroImageAlt: "Visual editorial de Talkaris mostrando una interfaz conversacional y paneles operativos.",
  primaryCtaLabel: "Solicitar demo",
  primaryCtaPath: "/solicitar-demo",
  secondaryCtaLabel: "Explorar plataforma",
  secondaryCtaPath: "/funcionalidades",
  indexable: true,
  leadInTitle: "Una web bonita no basta. Un chatbot bonito tampoco.",
  leadInBody:
    "La mayoría de soluciones conversacionales fallan por tres motivos: promesa vaga, experiencia mediocre y operación frágil. Talkaris nace para resolver las tres a la vez.",
  leadInProofs: [
    "Experiencia pública preparada para captar y calificar demanda.",
    "Producto embebible con branding, CTA y política conversacional por proyecto.",
    "Operación seria con ingestas, leads, conversaciones y gobierno global.",
  ],
  sections: [
    {
      id: "social-proof",
      eyebrow: "Prueba real",
      title: "Organizaciones que ya confían en Talkaris.",
      intro: "Empresas B2B que activaron IA conversacional en web, producto y soporte sin improvisar.",
      layout: "three-up",
      cards: [
        {
          eyebrow: "SaaS",
          title: "Onboarding conversacional activo",
          body: "Activaron el asistente en su producto SaaS para guiar la adopción desde el primer login sin tocar el equipo de soporte.",
          metric: "−40% tickets",
        },
        {
          eyebrow: "E-commerce B2B",
          title: "3x más demos cualificadas desde web",
          body: "Desplegaron el widget en su web pública orientado a captación y calificación de leads de producto.",
          metric: "3× pipeline",
        },
        {
          eyebrow: "Portal interno",
          title: "Conocimiento indexado en 2 horas",
          body: "Un equipo de 50 personas pasó de buscar en docs dispersos a consultar un asistente con el contexto correcto.",
          metric: "2h → producción",
        },
      ],
    },
    {
      id: "value-pillars",
      eyebrow: "Lo que cambia",
      title: "De chat accesorio a capa operativa real.",
      intro:
        "Cada bloque de Talkaris existe para empujar un resultado concreto: captar mejor, responder con contexto y escalar sin improvisación.",
      layout: "three-up",
      cards: [
        {
          eyebrow: "Captación",
          title: "Convierte conversaciones en pipeline útil",
          body: "CTA comerciales, detección de intención y formularios conectados al flujo de demo o revisión.",
          bullets: ["Mensajes orientados a valor", "Derivación a demo", "Experiencia coherente con tu marca"],
        },
        {
          eyebrow: "Asistencia",
          title: "Responde con conocimiento gobernado",
          body: "Sitemap, HTML, PDF y markdown bajo una misma capa de ingestión y reindexación controlada.",
          bullets: ["Fuentes auditables", "Contexto por proyecto", "Menos ruido, más precisión"],
        },
        {
          eyebrow: "Gobierno",
          title: "Escala varios productos sin perder control",
          body: "Tenant console y superadmin separan operación local y visión global para crecer con orden.",
          bullets: ["Aislamiento por tenant", "Políticas compartidas", "Visibilidad cross-tenant"],
        },
      ],
    },
    {
      id: "bento-outcomes",
      eyebrow: "Plataforma",
      title: "Diseñada para equipos que combinan marketing, producto, soporte y operaciones.",
      intro:
        "No vendemos un widget aislado: vendemos una infraestructura conversacional lista para trabajar en varios puntos del funnel y varias superficies digitales.",
      layout: "spotlight",
      image: "/assets/talkaris-integration-scene.svg",
      imageAlt: "Visual de arquitectura conversacional de Talkaris con múltiples integraciones y paneles.",
      cards: [
        {
          eyebrow: "Web corporativa",
          title: "Acelera la comprensión de la propuesta de valor",
          body: "Explica, filtra objeciones y empuja a demo desde la propia conversación.",
          metric: "Lead intent",
        },
        {
          eyebrow: "Producto SaaS",
          title: "Activa onboarding, soporte y upsell con el mismo núcleo",
          body: "Mantén mensajes, contexto y CTA alineados con cada producto o módulo.",
          metric: "Product adoption",
        },
        {
          eyebrow: "Portales operativos",
          title: "Da respuesta contextual sin depender siempre del equipo humano",
          body: "Documentación y ayuda en el momento exacto, con trazabilidad y analítica.",
          metric: "Support efficiency",
        },
        {
          eyebrow: "Operación central",
          title: "Gestiona branding, accesos y salud de plataforma desde arriba",
          body: "Ideal para varios tenants, marcas o líneas de negocio que exigen consistencia.",
          metric: "Platform governance",
        },
      ],
    },
    {
      id: "why-talkaris",
      eyebrow: "Diferencial",
      title: "Más serio que un chatbot de marketing. Más claro que una plataforma de IA genérica.",
      intro:
        "Talkaris se posiciona donde el negocio lo necesita: suficiente sofisticación técnica para operar de verdad y suficiente claridad comercial para convencer.",
      layout: "two-up",
      cards: [
        {
          eyebrow: "Lo habitual",
          title: "Stacks fragmentados",
          body: "Una landing por un lado, un chat por otro, documentación sin gobierno y métricas difíciles de conectar.",
          bullets: ["Promesas abstractas", "Experiencia desconectada", "Escalado poco mantenible"],
        },
        {
          eyebrow: "Con Talkaris",
          title: "Una capa conversacional coherente",
          body: "Captación, experiencia embebida, conocimiento, analítica y gobierno bajo una misma arquitectura.",
          bullets: ["Copy y UX orientados a negocio", "Control técnico real", "Preparado para varios productos"],
        },
      ],
    },
    {
      id: "pricing-teaser",
      eyebrow: "Precios",
      title: "Claro desde el primer día.",
      intro: "Sin sorpresas, sin contratos eternos. Un plan por proyecto, escalable cuando lo necesites.",
      layout: "three-up",
      cards: [
        {
          eyebrow: "Starter",
          title: "Desde 149€/mes",
          body: "1 proyecto, widget embebido, fuentes básicas, 1k conversaciones/mes.",
        },
        {
          eyebrow: "Growth",
          title: "Desde 399€/mes",
          body: "5 proyectos, todas las fuentes, handover humano, analytics avanzado, API.",
        },
        {
          eyebrow: "Enterprise",
          title: "A medida",
          body: "Multi-tenant completo, whitelabeling, SLA e integraciones CRM.",
        },
      ],
    },
  ],
  timelineTitle: "Cómo se implanta sin convertirlo en otro proyecto eterno.",
  timelineIntro:
    "El proceso está pensado para llegar rápido a producción, pero sin perder rigor en contenido, permisos, dominios ni experiencia de marca.",
  timeline: [
    {
      step: "01",
      title: "Definición de objetivo y superficie",
      body: "Se decide dónde va el asistente, qué acción debe provocar y qué conocimiento necesita para responder con criterio.",
    },
    {
      step: "02",
      title: "Configuración de proyecto, widget y fuentes",
      body: "Se preparan branding, CTA, dominios permitidos y orígenes de contenido bajo una política conversacional concreta.",
    },
    {
      step: "03",
      title: "Despliegue, medición y mejora",
      body: "El equipo opera leads, conversaciones e ingestas desde consola sin renunciar al control superadmin.",
    },
  ],
  faqs: [
    {
      question: "¿Talkaris sirve solo para captar leads?",
      answer:
        "No. También está pensado para soporte, onboarding, documentación y ayuda contextual dentro de productos o portales privados.",
    },
    {
      question: "¿Se puede operar más de una web o producto a la vez?",
      answer:
        "Sí. La arquitectura multi-tenant y multi-proyecto permite aislar branding, conocimiento, dominios y analítica por cada integración.",
    },
    {
      question: "¿Qué diferencia hay frente a un simple chat widget?",
      answer:
        "Talkaris no se limita a mostrar una ventana de chat. Añade gobierno de plataforma, fuentes versionadas, leads, analítica y control operacional.",
    },
    {
      question: "¿La demo usa el mismo contrato técnico que la integración real?",
      answer:
        "Sí. La demo pública se apoya en el mismo contrato de snippet y configuración que reciben los tenants operativos.",
    },
  ],
  ctaPanel: {
    eyebrow: "Siguiente paso",
    title: "Si necesitas una capa conversacional seria, la conversación ya no es si poner IA, sino cómo operarla bien.",
    body:
      "Solicita una demo para revisar tu caso, la superficie de integración y el tipo de flujo comercial o de soporte que quieres activar.",
    primaryLabel: "Solicitar demo",
    primaryPath: "/solicitar-demo",
    secondaryLabel: "Ver integraciones",
    secondaryPath: "/integraciones",
  },
};

const FEATURES_ES: PublicPageDefinition = {
  key: "features",
  locale: "es",
  path: "/funcionalidades",
  navLabel: "Plataforma",
  breadcrumbLabel: "Plataforma",
  title: "Funcionalidades de Talkaris",
  description:
    "Capacidades de Talkaris para desplegar asistentes de IA embebidos con conocimiento gobernado, operación multi-tenant y analítica real.",
  seoTitle: "Funcionalidades de Talkaris | Widget IA, conocimiento, analítica y gobierno",
  seoDescription:
    "Explora las funcionalidades de Talkaris: widget embebible, ingesta de conocimiento, leads, analítica conversacional y operación multi-tenant.",
  seoKeywords: [
    "funcionalidades chatbot ia",
    "widget ia embebible",
    "base de conocimiento chatbot",
    "analitica conversacional",
    "plataforma chatbot multitenant",
    "rag pipeline empresa",
    "chatbot con base de conocimiento",
    "ingestión pdf chatbot",
  ],
  heroEyebrow: "Plataforma conversacional",
  heroTitle: "Todo lo que hace falta para lanzar, medir y gobernar asistentes de IA embebidos.",
  heroCopy:
    "Talkaris conecta experiencia pública, operación de contenido y control de plataforma sin obligarte a montar un puzzle de herramientas.",
  heroSummary:
    "La funcionalidad importa cuando se traduce en menos fricción para el equipo y más valor visible para quien navega tu web o usa tu producto.",
  heroBadges: ["Snippet asíncrono", "Ingestas versionadas", "Consolas operativas"],
  heroStats: [
    {
      value: "Widget",
      label: "Embebible y configurable",
      detail: "Branding, mensaje, CTA y dominios permitidos definidos por proyecto.",
    },
    {
      value: "Contenido",
      label: "Listo para ingerir y reindexar",
      detail: "Sitemap, HTML, PDF y markdown con trazabilidad operacional.",
    },
    {
      value: "Control",
      label: "Tenant y superadmin",
      detail: "Operación local con visión global cuando la plataforma crece.",
    },
  ],
  heroImage: "/assets/talkaris-hero-scene.svg",
  heroImageAlt: "Visual de la plataforma Talkaris con módulos de widget, conocimiento y analítica.",
  primaryCtaLabel: "Solicitar demo",
  primaryCtaPath: "/solicitar-demo",
  secondaryCtaLabel: "Ver integraciones",
  secondaryCtaPath: "/integraciones",
  indexable: true,
  leadInTitle: "Funcionalidad que suma negocio, no checklists por postureo.",
  leadInBody:
    "Cada capacidad de Talkaris está pensada para responder a una necesidad operativa concreta: integrar rápido, responder mejor y mantener gobierno a medida que el uso crece.",
  leadInProofs: [
    "Configuración por proyecto para evitar experiencias clonadas.",
    "Fuentes gestionadas desde consola para no depender de cambios manuales.",
    "Leads y conversaciones conectados con el mismo núcleo técnico.",
  ],
  sections: [
    {
      id: "widget",
      eyebrow: "Widget y experiencia",
      title: "El front conversacional está listo para convivir con una web premium o un SaaS serio.",
      intro:
        "La capa visible debe convertir y resolver dudas. Por eso el widget se configura como una extensión coherente de la marca, no como un injerto visual.",
      layout: "two-up",
      cards: [
        {
          title: "Carga asíncrona por snippet",
          body: "Integración ligera con configuración resuelta desde API y compatibilidad con alias heredados.",
          bullets: ["Site key por proyecto", "Dominios permitidos", "Sin acoplar el portal público al producto"],
        },
        {
          title: "Branding y CTA adaptados a cada contexto",
          body: "Nombre, mensaje de bienvenida, CTA comercial y tema visual ajustados por integración.",
          bullets: ["Flujos de captación", "Tono por producto", "Coherencia entre marketing y soporte"],
        },
      ],
    },
    {
      id: "knowledge",
      eyebrow: "Conocimiento y respuesta",
      title: "La utilidad real aparece cuando el conocimiento está gobernado.",
      intro:
        "No basta con conectar documentos. Hay que controlar fuentes, visibilidad, reindexación y trazabilidad para que la IA responda con contexto y límites claros.",
      layout: "three-up",
      cards: [
        {
          title: "Ingesta desde sitemap, HTML, PDF y markdown",
          body: "Las fuentes se gestionan desde consola y generan documentos utilizables por proyecto.",
        },
        {
          title: "Versionado y seguimiento operacional",
          body: "Cada documento conserva historia de ingestión y versión para que el equipo sepa qué está respondiendo el sistema.",
        },
        {
          title: "Aislamiento por tenant y proyecto",
          body: "El conocimiento no se mezcla entre clientes, aplicaciones o superficies digitales distintas.",
        },
      ],
    },
    {
      id: "operations",
      eyebrow: "Operación",
      title: "Leads, conversaciones y analítica en el mismo circuito.",
      intro:
        "El objetivo no es solo responder. El objetivo es entender qué ocurre, detectar demanda y mejorar el sistema con criterio.",
      layout: "three-up",
      cards: [
        {
          title: "Leads con contexto conversacional",
          body: "La intención comercial no se pierde entre formularios aislados y mensajes sueltos.",
        },
        {
          title: "Resumen de analítica por proyecto",
          body: "Eventos, estados de lead y preguntas no resueltas para detectar huecos reales de contenido.",
        },
        {
          title: "Superadmin para salud global",
          body: "Branding, accesos, tenants y visión cross-tenant desde una única capa de gobierno.",
        },
      ],
    },
    {
      id: "llm-providers",
      eyebrow: "Modelos LLM",
      title: "Tú eliges el modelo. Nosotros ponemos el stack.",
      intro: "OpenAI, Anthropic Claude, DeepSeek y Google Gemini disponibles sin cambiar la integración.",
      layout: "two-up",
      image: "/assets/talkaris-llm-scene.png",
      imageAlt: "Diagrama de modelos LLM disponibles en Talkaris",
      cards: [
        {
          title: "Multi-modelo nativo",
          body: "Cambia de GPT-4 a Claude a DeepSeek sin tocar tu widget ni tu base de conocimiento. Un selector en el cockpit.",
        },
        {
          title: "Gemini multimodal",
          body: "Ingesta vídeo, audio, imágenes y PDFs complejos mediante Google Gemini. Nuevo tipo de fuente gemini_file.",
        },
      ],
    },
    {
      id: "integrations-teaser",
      eyebrow: "Ecosistema",
      title: "Conecta con lo que ya usas.",
      intro: "Webhooks, API keys, HubSpot, Zendesk, Notion, YouTube, Google Drive y más.",
      layout: "three-up",
      cards: [
        {
          eyebrow: "Fuentes de conocimiento",
          title: "Notion, YouTube, PDF, Sitemap",
          body: "Ingesta desde las fuentes donde ya vive tu contenido sin migraciones ni duplicados.",
        },
        {
          eyebrow: "CRM y soporte",
          title: "HubSpot y Zendesk",
          body: "Sincroniza leads y tickets con las herramientas de tu equipo de ventas y soporte.",
        },
        {
          eyebrow: "Developer API",
          title: "API REST + Webhooks",
          body: "77+ endpoints documentados, API keys con scopes y webhooks con HMAC signing.",
        },
      ],
    },
  ],
  timelineTitle: "Arquitectura preparada para crecer sin rehacerlo todo.",
  timelineIntro:
    "La plataforma separa integración, conocimiento y gobierno para que puedas avanzar por fases sin perder coherencia técnica.",
  timeline: [
    {
      step: "01",
      title: "Publica la experiencia",
      body: "Activa widget, copy, CTA y branding sobre la superficie que más impacto genera hoy.",
    },
    {
      step: "02",
      title: "Conecta conocimiento y medición",
      body: "Alimenta el sistema con documentación útil y empieza a leer conversaciones y leads con contexto.",
    },
    {
      step: "03",
      title: "Escala a varios productos o clientes",
      body: "Activa aislamiento por proyecto, tenants y control superadmin para operar como plataforma.",
    },
  ],
  ctaPanel: {
    eyebrow: "Demo",
    title: "Revisa las funcionalidades sobre un caso concreto, no sobre una lista abstracta.",
    body:
      "En la demo bajamos la conversación a tu web, tu producto y tu operación real para validar encaje técnico y comercial.",
    primaryLabel: "Solicitar demo",
    primaryPath: "/solicitar-demo",
    secondaryLabel: "Ver casos de uso",
    secondaryPath: "/casos-de-uso",
  },
};

const INTEGRATIONS_ES: PublicPageDefinition = {
  key: "integrations",
  locale: "es",
  path: "/integraciones",
  navLabel: "Integraciones",
  breadcrumbLabel: "Integraciones",
  title: "Integraciones de Talkaris",
  description:
    "Cómo se integra Talkaris en webs corporativas, aplicaciones SaaS, centros de ayuda, portales privados y flujos de soporte o preventa.",
  seoTitle: "Integraciones de Talkaris | Chatbot IA para web, SaaS y portales",
  seoDescription:
    "Descubre cómo integrar Talkaris en webs corporativas, productos SaaS y portales operativos con un widget IA embebible y gobernado.",
  seoKeywords: [
    "integracion chatbot ia web",
    "chatbot ia para saas",
    "asistente ia para portal privado",
    "widget ia para soporte",
    "chatbot ia para preventa",
    "chatbot telegram",
    "chatbot notion",
    "chatbot youtube transcripcion",
  ],
  heroEyebrow: "Contextos de despliegue",
  heroTitle: "Una sola plataforma. Varias superficies conversacionales bien resueltas.",
  heroCopy:
    "Talkaris está preparado para convivir con una web corporativa, un SaaS, una extranet o un portal de soporte sin perder coherencia entre experiencia y operación.",
  heroSummary:
    "Integrar bien significa respetar el contexto de cada superficie mientras mantienes una capa técnica consistente por debajo.",
  heroBadges: ["Web corporativa", "Producto SaaS", "Portales privados"],
  heroStats: [
    {
      value: "Marketing",
      label: "Captación y calificación",
      detail: "Ideal para convertir visitas en conversaciones útiles orientadas a demo.",
    },
    {
      value: "Producto",
      label: "Onboarding y ayuda contextual",
      detail: "Asistencia donde el usuario la necesita, sin salir del flujo del producto.",
    },
    {
      value: "Operación",
      label: "Soporte y documentación",
      detail: "Conocimiento desplegado sobre centros de ayuda o áreas privadas.",
    },
  ],
  heroImage: "/assets/talkaris-integration-scene.svg",
  heroImageAlt: "Visual premium de Talkaris con varios puntos de integración conversacional.",
  primaryCtaLabel: "Solicitar demo",
  primaryCtaPath: "/solicitar-demo",
  secondaryCtaLabel: "Explorar plataforma",
  secondaryCtaPath: "/funcionalidades",
  indexable: true,
  leadInTitle: "El contexto de integración importa tanto como el modelo.",
  leadInBody:
    "No se conversa igual en una landing de captación que en un panel operativo. Talkaris permite adaptar la experiencia sin multiplicar la complejidad interna.",
  leadInProofs: [
    "Mensajes y CTA específicos por superficie.",
    "Dominios permitidos y configuración separada.",
    "Operación unificada aunque la experiencia cambie.",
  ],
  sections: [
    {
      id: "marketing",
      eyebrow: "Web corporativa",
      title: "Una landing comercial puede vender mejor cuando la conversación está bien diseñada.",
      intro:
        "Talkaris ayuda a explicar propuesta de valor, filtrar objeciones y llevar al usuario a demo sin romper la navegación ni sonar robótico.",
      layout: "two-up",
      cards: [
        {
          title: "Asistencia comercial above the fold",
          body: "La web explica mejor lo que haces y el asistente remata las dudas clave en el momento adecuado.",
        },
        {
          title: "CTA coherente con la intención",
          body: "No todo usuario necesita el mismo siguiente paso. Talkaris permite empujar demo, contacto o revisión según contexto.",
        },
      ],
    },
    {
      id: "saas",
      eyebrow: "Producto SaaS",
      title: "El mismo núcleo sirve para activación, soporte y expansión dentro del producto.",
      intro:
        "Un asistente útil dentro del SaaS reduce fricción, acelera onboarding y abre oportunidades de adopción sin depender siempre de tickets o calls.",
      layout: "three-up",
      cards: [
        {
          title: "Ayuda contextual en pantallas críticas",
          body: "Onboarding, configuración inicial o módulos complejos con soporte dentro del propio flujo.",
        },
        {
          title: "Respuestas alineadas con documentación real",
          body: "La base de conocimiento se gobierna desde consola y se puede actualizar sin tocar el front.",
        },
        {
          title: "Escalado por módulos, productos o tenants",
          body: "Especialmente útil cuando la empresa opera más de una app o varias marcas.",
        },
      ],
    },
    {
      id: "ops",
      eyebrow: "Portales y soporte",
      title: "También encaja en entornos donde la precisión y el gobierno pesan más que el marketing.",
      intro:
        "Centros de ayuda, áreas privadas, extranets o bases documentales pueden beneficiarse de una capa conversacional siempre que exista control operacional detrás.",
      layout: "three-up",
      cards: [
        {
          title: "Extranets y áreas cliente",
          body: "Asistencia sobre procedimientos, documentación o preguntas repetitivas de alto volumen.",
        },
        {
          title: "Documentación técnica",
          body: "Respuestas apoyadas en HTML, PDF o markdown autorizados y versionados.",
        },
        {
          title: "Captura de señales operativas",
          body: "Preguntas no resueltas y leads detectados para mejorar contenidos y flujos.",
        },
      ],
    },
    {
      id: "developer-api",
      eyebrow: "Para desarrolladores",
      title: "API REST + Webhooks + SDK de widget.",
      intro: "Construye sobre Talkaris con documentación clara, API keys con scopes y webhooks con HMAC signing.",
      layout: "three-up",
      cards: [
        {
          eyebrow: "REST API",
          title: "77+ endpoints documentados",
          body: "Gestiona proyectos, bots, conocimiento y conversaciones desde tu infraestructura con autenticación Bearer.",
        },
        {
          eyebrow: "Webhooks",
          title: "Push de eventos en tiempo real",
          body: "Recibe eventos de conversación, lead e ingesta con payload firmado HMAC para validación segura.",
        },
        {
          eyebrow: "Widget SDK",
          title: "postMessage API pública",
          body: "Controla el widget desde la página host: abrir, cerrar, enviar contexto y escuchar eventos.",
        },
      ],
    },
  ],
  ctaPanel: {
    eyebrow: "Encaje",
    title: "La mejor integración no es la más llamativa: es la que encaja con tu superficie y tu operación real.",
    body:
      "Solicita una demo y revisamos el mejor punto de entrada para Talkaris en tu web, tu producto o tu circuito de soporte.",
    primaryLabel: "Solicitar demo",
    primaryPath: "/solicitar-demo",
    secondaryLabel: "Ver FAQ",
    secondaryPath: "/faq",
  },
};

const USE_CASES_ES: PublicPageDefinition = {
  key: "use-cases",
  locale: "es",
  path: "/casos-de-uso",
  navLabel: "Casos de uso",
  breadcrumbLabel: "Casos de uso",
  title: "Casos de uso de Talkaris",
  description:
    "Casos de uso de Talkaris para preventa, soporte, onboarding, documentación y operación multi-marca o multi-producto.",
  seoTitle: "Casos de uso de Talkaris | Preventa, soporte, onboarding y documentación",
  seoDescription:
    "Descubre casos de uso reales de Talkaris para preventa, soporte, onboarding, help centers y operación multi-producto.",
  seoKeywords: [
    "casos de uso chatbot ia",
    "chatbot ia para preventa",
    "chatbot ia para soporte",
    "asistente ia onboarding saas",
    "ia conversacional para documentacion",
    "chatbot soporte técnico",
    "chatbot onboarding saas",
    "asistente ia web corporativa",
  ],
  heroEyebrow: "Aplicaciones reales",
  heroTitle: "Preventa, soporte, onboarding y documentación: donde la conversación aporta valor de verdad.",
  heroCopy:
    "Talkaris funciona mejor cuando parte de un objetivo claro. Cada caso de uso define qué debe resolver el asistente, qué objeciones debe tratar y a qué acción debe empujar.",
  heroSummary:
    "Esa claridad es la diferencia entre una conversación útil y una experiencia que distrae, confunde o simplemente no convierte.",
  heroBadges: ["Preventa", "Soporte", "Onboarding"],
  heroStats: [
    {
      value: "Preventa",
      label: "Califica y activa interés",
      detail: "Ideal para webs de servicios, software o consultoría que necesitan explicar bien una solución compleja.",
    },
    {
      value: "Soporte",
      label: "Resuelve sin saturar al equipo",
      detail: "Útil en help centers, áreas cliente y productos con preguntas repetitivas.",
    },
    {
      value: "Onboarding",
      label: "Acompaña la activación",
      detail: "Reduce tiempo de aprendizaje y aumenta adopción dentro del producto.",
    },
  ],
  heroImage: "/assets/talkaris-hero-scene.svg",
  heroImageAlt: "Visual editorial de distintos casos de uso de Talkaris en marketing, soporte y producto.",
  primaryCtaLabel: "Solicitar demo",
  primaryCtaPath: "/solicitar-demo",
  secondaryCtaLabel: "Ver integraciones",
  secondaryCtaPath: "/integraciones",
  indexable: true,
  leadInTitle: "Un mismo producto, varios problemas resueltos con precisión.",
  leadInBody:
    "Talkaris no compite por ser el chatbot más vistoso. Compite por ser la solución que mejor conecta conversación, contenido y siguiente paso según el momento del usuario.",
  leadInProofs: [
    "Respuestas comerciales para fases tempranas del funnel.",
    "Ayuda contextual para reducir fricción operativa.",
    "Gobierno suficiente para desplegarlo en varias líneas de negocio.",
  ],
  sections: [
    {
      id: "pre-sales",
      eyebrow: "Preventa",
      title: "Explica mejor lo complejo y detecta intención real.",
      intro:
        "Cuando la propuesta de valor necesita contexto, una buena conversación acorta el tiempo entre visita y demo.",
      layout: "three-up",
      cards: [
        {
          title: "Filtrado de objeciones frecuentes",
          body: "Responde dudas sobre alcance, integración, tiempos o encaje antes de que el usuario abandone.",
        },
        {
          title: "CTA comercial con más contexto",
          body: "Lleva a demo o revisión con señales de intención y necesidades capturadas dentro de la conversación.",
        },
        {
          title: "Mayor claridad comercial",
          body: "Especialmente útil cuando la solución es potente pero difícil de entender en una sola lectura.",
        },
      ],
    },
    {
      id: "support",
      eyebrow: "Soporte y documentación",
      title: "Reduce fricción cuando el usuario ya está dentro y necesita avanzar.",
      intro:
        "Aquí el objetivo no es impresionar: es ayudar bien, rápido y con conocimiento autorizado.",
      layout: "three-up",
      cards: [
        {
          title: "Help centers y bases de conocimiento",
          body: "Aporta acceso conversacional a documentación que ya existe, pero hoy se consulta mal.",
        },
        {
          title: "Portales privados y extranets",
          body: "Asistencia contextual sobre procesos, normativa o procedimientos repetitivos.",
        },
        {
          title: "Detección de huecos de contenido",
          body: "Las preguntas sin respuesta ayudan a priorizar mejoras reales en la base documental.",
        },
      ],
    },
    {
      id: "activation",
      eyebrow: "Onboarding y adopción",
      title: "La conversación también puede acelerar time-to-value.",
      intro:
        "Dentro del producto, Talkaris puede guiar pasos iniciales, aclarar configuración y reducir abandono en fases tempranas.",
      layout: "two-up",
      cards: [
        {
          title: "Onboarding guiado",
          body: "Resuelve dudas recurrentes sin sacar al usuario del flujo ni obligarle a buscar documentación dispersa.",
        },
        {
          title: "Expansión a módulos o planes superiores",
          body: "Cuando tiene sentido, el asistente también puede detectar oportunidades de upsell o activación de funcionalidades.",
        },
      ],
    },
    {
      id: "channels",
      eyebrow: "Canales",
      title: "El mismo bot, en tu web y en Telegram.",
      intro: "Conecta tu asistente a Telegram con un token. El mismo conocimiento y política conversacional, en otro canal.",
      layout: "two-up",
      cards: [
        {
          title: "Telegram sin código adicional",
          body: "Configura el canal Telegram desde el cockpit con tu bot token. El widget y Telegram comparten el mismo knowledge base y flujo conversacional.",
          bullets: ["Un token, canal activo", "Mismo conocimiento gobernado", "Conversaciones en la misma consola"],
        },
        {
          title: "Multi-canal, un solo gobierno",
          body: "Administra todos los canales desde el mismo panel operativo. Conversaciones, leads y analítica unificados sin importar desde dónde llegó el usuario.",
          bullets: ["Web + Telegram + futuras integraciones", "Analítica unificada", "Escalable a más canales"],
        },
      ],
    },
  ],
  ctaPanel: {
    eyebrow: "Aplicación",
    title: "Si el caso de uso está claro, la conversación empieza a generar valor muy rápido.",
    body:
      "Solicita una demo y revisamos juntos qué caso de uso deberías atacar primero para conseguir impacto real con el menor despliegue posible.",
    primaryLabel: "Solicitar demo",
    primaryPath: "/solicitar-demo",
    secondaryLabel: "Ver plataforma",
    secondaryPath: "/funcionalidades",
  },
};

const FAQ_ES: PublicPageDefinition = {
  key: "faq",
  locale: "es",
  path: "/faq",
  navLabel: "FAQ",
  breadcrumbLabel: "FAQ",
  title: "Preguntas frecuentes sobre Talkaris",
  description:
    "Preguntas frecuentes sobre integración, multi-tenant, conocimiento, seguridad operacional y despliegue de Talkaris.",
  seoTitle: "FAQ de Talkaris | Integración, conocimiento, multi-tenant y despliegue",
  seoDescription:
    "Respuestas a las preguntas frecuentes sobre Talkaris: integración, ingestión de contenido, operación multi-tenant y despliegue.",
  seoKeywords: [
    "faq chatbot ia",
    "preguntas frecuentes talkaris",
    "integracion asistente ia",
    "chatbot multitenant faq",
    "ingesta conocimiento ia",
  ],
  heroEyebrow: "Respuestas rápidas",
  heroTitle: "Lo importante sobre Talkaris, sin vaguedad ni humo.",
  heroCopy:
    "Si estás evaluando una plataforma conversacional seria, estas son las preguntas que suelen aparecer antes de una demo o una implantación real.",
  heroSummary:
    "La idea es ayudarte a entender el encaje técnico y operativo del producto antes de pasar a una revisión concreta de tu caso.",
  heroBadges: ["Integración", "Conocimiento", "Gobierno"],
  heroStats: [
    {
      value: "Snippet",
      label: "Integración directa",
      detail: "El widget se embebe mediante snippet y configuración por proyecto.",
    },
    {
      value: "Fuentes",
      label: "Contenido controlado",
      detail: "HTML, sitemap, PDF y markdown gestionados desde la consola.",
    },
    {
      value: "Roles",
      label: "Gobierno por capas",
      detail: "Tenant console para operación y superadmin para control global.",
    },
  ],
  heroImage: "/assets/talkaris-editorial-campaign.png",
  heroImageAlt: "Visual editorial premium usado como apoyo para la sección de preguntas frecuentes.",
  primaryCtaLabel: "Solicitar demo",
  primaryCtaPath: "/solicitar-demo",
  secondaryCtaLabel: "Volver al inicio",
  secondaryCtaPath: "/",
  indexable: true,
  leadInTitle: "Las preguntas útiles suelen ser las que aterrizan la conversación.",
  leadInBody:
    "Hemos priorizado dudas que ayudan a entender cómo encaja Talkaris en una operación real, no preguntas de relleno pensadas solo para SEO.",
  leadInProofs: [
    "Respuestas específicas y mantenibles.",
    "Alineadas con el producto real y la arquitectura existente.",
    "Útiles tanto para conversión como para discoverability orgánica.",
  ],
  sections: [
    {
      id: "faq-intro",
      eyebrow: "FAQ",
      title: "Preguntas que suelen determinar si hay encaje o no.",
      intro:
        "La mejor forma de aprovechar esta sección es usarla como filtro inicial. Si tu caso encaja, lo siguiente es revisar una demo con contexto.",
      layout: "two-up",
      cards: [
        {
          title: "Integración y despliegue",
          body: "Cómo se activa el widget, qué superficies soporta y qué nivel de configuración tiene por proyecto.",
        },
        {
          title: "Conocimiento, operación y gobierno",
          body: "Qué contenido puede ingerir, cómo se gestiona y qué capas de control existen.",
        },
      ],
    },
  ],
  faqs: [
    {
      question: "¿Cómo se integra Talkaris en una web o aplicación?",
      answer:
        "Mediante snippet del widget, site key por proyecto y dominios permitidos. La configuración de branding, CTA y operación se resuelve desde la plataforma.",
    },
    {
      question: "¿Qué contenido puede usar para responder?",
      answer:
        "Actualmente puede ingerir sitemap, HTML, PDF y markdown. Las fuentes se gestionan desde consola y pueden reindexarse cuando cambia el contenido.",
    },
    {
      question: "¿Se puede usar en varias webs o productos a la vez?",
      answer:
        "Sí. La arquitectura multi-tenant y multi-proyecto permite operar varias integraciones con aislamiento claro de conocimiento, branding, analítica y conversaciones.",
    },
    {
      question: "¿Sirve para soporte además de para captación comercial?",
      answer:
        "Sí. Talkaris está planteado para preventa, soporte, onboarding, documentación y otros flujos donde la conversación necesite contexto útil y control operacional.",
    },
    {
      question: "¿Quién controla el acceso y la configuración global?",
      answer:
        "La capa superadmin centraliza branding, revisión de solicitudes, tenants, usuarios y visión global de plataforma; cada tenant opera su día a día desde su consola.",
    },
    {
      question: "¿La demo pública es un adorno o refleja el producto real?",
      answer:
        "Refleja el mismo contrato técnico de integración que reciben los proyectos reales, por lo que sirve para validar la experiencia de forma honesta.",
    },
  ],
  ctaPanel: {
    eyebrow: "Siguiente paso",
    title: "Si tu pregunta no aparece aquí, seguramente merece una demo con tu contexto encima de la mesa.",
    body:
      "Solicita una demo y revisamos integración, caso de uso, contenidos necesarios y criterios de implantación sin humo.",
    primaryLabel: "Solicitar demo",
    primaryPath: "/solicitar-demo",
    secondaryLabel: "Ver integraciones",
    secondaryPath: "/integraciones",
  },
};

const BLOG_ES: PublicPageDefinition = {
  key: "blog",
  locale: "es",
  path: "/blog",
  navLabel: "Blog",
  breadcrumbLabel: "Blog",
  title: "Blog de Talkaris",
  description:
    "Contenido editorial sobre IA conversacional, integración de chatbots en webs y SaaS, operaciones de conocimiento y estrategia conversacional.",
  seoTitle: "Blog de Talkaris | IA conversacional, chatbots para SaaS y operaciones de conocimiento",
  seoDescription:
    "Guías y análisis sobre IA conversacional, chatbots para web y producto, documentación operativa y mejores prácticas de despliegue.",
  seoKeywords: [
    "blog ia conversacional",
    "chatbot para saas blog",
    "operaciones de conocimiento",
    "chatbot para web corporativa",
    "estrategia conversacional b2b",
  ],
  heroEyebrow: "Contenido editorial",
  heroTitle: "Ideas, guías y criterio práctico para equipos que quieren desplegar IA conversacional con cabeza.",
  heroCopy:
    "El blog de Talkaris está pensado para quienes necesitan integrar, gobernar y rentabilizar experiencias conversacionales en webs, productos y operaciones de soporte.",
  heroSummary:
    "No perseguimos contenido superficial. Perseguimos piezas que ayuden a entender mejor el stack, la estrategia y la implantación.",
  heroBadges: ["SEO evergreen", "Contenido B2B", "Operación real"],
  heroStats: [
    {
      value: "Guías",
      label: "Cómo implantar y operar",
      detail: "Artículos pensados para responder dudas comerciales y técnicas con intención real.",
    },
    {
      value: "Comparativas",
      label: "Qué enfoque conviene más",
      detail: "Contenido útil para evaluación, no listas genéricas de herramientas.",
    },
    {
      value: "Notas",
      label: "Producto y arquitectura",
      detail: "Explicaciones sobre capacidades, integraciones y evolución del stack.",
    },
  ],
  heroImage: "/assets/talkaris-blog-scene.svg",
  heroImageAlt: "Visual editorial premium para la sección de contenidos del blog de Talkaris.",
  primaryCtaLabel: "Solicitar demo",
  primaryCtaPath: "/solicitar-demo",
  secondaryCtaLabel: "Ver plataforma",
  secondaryCtaPath: "/funcionalidades",
  indexable: true,
  leadInTitle: "Una base SEO útil empieza con contenido que sirva al negocio y a la audiencia.",
  leadInBody:
    "La capa editorial de Talkaris está diseñada para atacar términos comerciales e informacionales sin canibalizar la propuesta principal ni caer en SEO artificial.",
  leadInProofs: [
    "Cobertura de intención de búsqueda comercial e informacional.",
    "Enlazado natural hacia plataforma, integraciones y demo.",
    "Base preparada para crecer sin romper diseño ni jerarquía.",
  ],
  sections: [
    {
      id: "editorial-lanes",
      eyebrow: "Líneas editoriales",
      title: "Tres territorios de contenido para construir autoridad útil.",
      intro:
        "Mientras el blog se sigue poblando desde Auctorio, estas son las líneas editoriales previstas para escalar relevancia semántica con sentido.",
      layout: "three-up",
      cards: [
        {
          title: "IA conversacional para negocio B2B",
          body: "Piezas sobre captación, cualificación, soporte, onboarding y experiencia de marca.",
        },
        {
          title: "Integración técnica en web y SaaS",
          body: "Contenidos sobre widgets embebidos, conocimiento, dominios permitidos y operación multi-proyecto.",
        },
        {
          title: "Gobierno, contenido y rendimiento",
          body: "Buenas prácticas sobre arquitectura, SEO, datos estructurados y operaciones de conocimiento.",
        },
      ],
    },
  ],
  ctaPanel: {
    eyebrow: "Conversión",
    title: "Si el contenido te ayuda a ver el encaje, la siguiente conversación debe ser sobre tu implementación real.",
    body:
      "Solicita una demo y aterrizamos la estrategia conversacional en tu web, tu producto o tu soporte operativo.",
    primaryLabel: "Solicitar demo",
    primaryPath: "/solicitar-demo",
    secondaryLabel: "Ver casos de uso",
    secondaryPath: "/casos-de-uso",
  },
};

const HOME_EN: PublicPageDefinition = {
  ...HOME_ES,
  locale: "en",
  path: "/en",
  navLabel: "Home",
  breadcrumbLabel: "Home",
  description:
    "Conversational AI platform for companies that need to capture demand, assist users and operate embedded assistants without improvised tooling.",
  seoTitle: "Talkaris | Conversational AI platform for websites, SaaS and support operations",
  seoDescription:
    "Turn your website, product or support portal into a serious conversational experience with embedded widget, governed knowledge and multi-tenant operations.",
  seoKeywords: [
    "conversational ai platform",
    "embedded ai chat widget",
    "ai assistant for saas",
    "customer support ai platform",
    "multi tenant chatbot platform",
    "b2b web chatbot",
    "ai customer support assistant",
    "intelligent chat widget",
    "enterprise rag platform",
    "multimodal chatbot",
    "intercom ai alternative",
  ],
  heroEyebrow: "Conversational AI infrastructure",
  heroTitle: "Deploy an AI assistant that actually works. Widget, knowledge and analytics in one stack.",
  heroCopy:
    "Talkaris combines embeddable widget, governed knowledge, conversation analytics and multi-tenant operations so B2B teams can launch useful experiences instead of empty demos.",
  heroSummary:
    "Built for teams that need commercial clarity, technical governance and a public layer capable of converting from the first scroll.",
  primaryCtaLabel: "Request demo",
  primaryCtaPath: "/en/request-demo",
  secondaryCtaLabel: "Explore platform",
  secondaryCtaPath: "/en/features",
  leadInTitle: "A nice website is not enough. A nice-looking chatbot is not enough either.",
  leadInBody:
    "Most conversational products fail for three reasons: vague positioning, mediocre experience and fragile operations. Talkaris is built to solve all three together.",
  leadInProofs: [
    "Public experience ready to capture and qualify demand.",
    "Embeddable product with branding, CTA and conversation policy per project.",
    "Serious operations with ingestions, leads, conversations and global governance.",
  ],
  sections: [
    {
      id: "social-proof",
      eyebrow: "Real proof",
      title: "Organizations already running on Talkaris.",
      intro: "B2B companies that activated conversational AI on web, product and support without improvising.",
      layout: "three-up",
      cards: [
        {
          eyebrow: "SaaS",
          title: "Conversational onboarding live",
          body: "Activated the assistant in their SaaS product to guide adoption from the first login without touching the support team.",
          metric: "−40% tickets",
        },
        {
          eyebrow: "B2B E-commerce",
          title: "3x more qualified demos from web",
          body: "Deployed the widget on their public website focused on lead capture and qualification.",
          metric: "3× pipeline",
        },
        {
          eyebrow: "Internal portal",
          title: "Knowledge indexed in 2 hours",
          body: "A 50-person team moved from searching scattered docs to querying an assistant with the right context.",
          metric: "2h → production",
        },
      ],
    },
    {
      ...HOME_ES.sections[1],
      eyebrow: "What changes",
      title: "From accessory chat to an operational layer.",
      intro:
        "Every Talkaris block exists to push a concrete outcome: convert better, answer with context and scale without improvisation.",
      cards: [
        {
          eyebrow: "Demand capture",
          title: "Turn conversations into qualified pipeline",
          body: "Commercial CTAs, intent detection and forms connected to demo or review flows.",
          bullets: ["Value-driven messaging", "Demo routing", "Brand-coherent experience"],
        },
        {
          eyebrow: "Assistance",
          title: "Answer with governed knowledge",
          body: "Sitemap, HTML, PDF and markdown under one ingestion and re-indexing layer.",
          bullets: ["Auditable sources", "Project-level context", "Less noise, more precision"],
        },
        {
          eyebrow: "Governance",
          title: "Scale across products without losing control",
          body: "Tenant console and superadmin separate local operation from platform-level visibility.",
          bullets: ["Tenant isolation", "Shared policies", "Cross-tenant visibility"],
        },
      ],
    },
    {
      ...HOME_ES.sections[2],
      eyebrow: "Platform",
      title: "Built for teams that blend marketing, product, support and operations.",
      intro:
        "This is not a standalone chat widget. It is a conversational infrastructure that can work across multiple funnel stages and digital surfaces.",
      cards: [
        {
          eyebrow: "Corporate site",
          title: "Accelerate value understanding",
          body: "Explain, handle objections and push to demo from the conversation itself.",
          metric: "Lead intent",
        },
        {
          eyebrow: "SaaS product",
          title: "Power onboarding, support and expansion with the same core",
          body: "Keep messaging, context and CTA aligned with each product or module.",
          metric: "Product adoption",
        },
        {
          eyebrow: "Operational portals",
          title: "Deliver contextual help without always escalating to humans",
          body: "Documentation and support at the right moment, with traceability and analytics.",
          metric: "Support efficiency",
        },
        {
          eyebrow: "Platform team",
          title: "Manage branding, access and health from the top",
          body: "Ideal for multiple tenants, brands or business lines that require consistency.",
          metric: "Platform governance",
        },
      ],
    },
    {
      ...HOME_ES.sections[3],
      eyebrow: "Differentiation",
      title: "More serious than a marketing chatbot. Clearer than a generic AI platform.",
      intro:
        "Talkaris positions itself where the business needs it: enough technical depth to operate for real and enough commercial clarity to persuade.",
      cards: [
        {
          eyebrow: "What is common",
          title: "Fragmented stacks",
          body: "One landing page, a separate chat, unmanaged documentation and metrics that are hard to connect.",
          bullets: ["Abstract promises", "Disconnected experience", "Poor long-term maintainability"],
        },
        {
          eyebrow: "With Talkaris",
          title: "A coherent conversational layer",
          body: "Demand capture, embeddable experience, knowledge, analytics and governance under one architecture.",
          bullets: ["Business-driven UX and copy", "Real technical control", "Ready for multiple products"],
        },
      ],
    },
    {
      id: "pricing-teaser",
      eyebrow: "Pricing",
      title: "Clear from day one.",
      intro: "No surprises, no eternal contracts. One plan per project, scalable when you need it.",
      layout: "three-up",
      cards: [
        {
          eyebrow: "Starter",
          title: "From €149/month",
          body: "1 project, embedded widget, basic sources, 1k conversations/month.",
        },
        {
          eyebrow: "Growth",
          title: "From €399/month",
          body: "5 projects, all sources, human handover, advanced analytics, API.",
        },
        {
          eyebrow: "Enterprise",
          title: "Custom",
          body: "Full multi-tenant, whitelabeling, SLA and CRM integrations.",
        },
      ],
    },
  ],
  timelineTitle: "How deployment works without turning into yet another endless project.",
  timelineIntro:
    "The process is designed to reach production quickly without losing rigor around content, permissions, domains or brand experience.",
  timeline: [
    {
      step: "01",
      title: "Define goal and surface",
      body: "Decide where the assistant lives, what action it should drive and what knowledge it needs to respond with intent.",
    },
    {
      step: "02",
      title: "Configure project, widget and sources",
      body: "Set branding, CTA, allowed domains and content sources under a clear conversation policy.",
    },
    {
      step: "03",
      title: "Deploy, measure and improve",
      body: "Teams operate leads, conversations and ingestions from the console without giving up superadmin control.",
    },
  ],
  faqs: [
    {
      question: "Is Talkaris only for lead capture?",
      answer: "No. It is also built for support, onboarding, documentation and contextual help inside products or private portals.",
    },
    {
      question: "Can it operate across several websites or products?",
      answer:
        "Yes. The multi-tenant and multi-project architecture isolates branding, knowledge, domains and analytics for every integration.",
    },
    {
      question: "How is it different from a simple chat widget?",
      answer:
        "Talkaris is not just a chat window. It adds platform governance, versioned sources, leads, analytics and operational control.",
    },
    {
      question: "Does the public demo use the same technical contract as the real integration?",
      answer:
        "Yes. The public demo relies on the same snippet and configuration contract that real tenants receive.",
    },
  ],
  ctaPanel: {
    eyebrow: "Next step",
    title: "If you need a serious conversational layer, the conversation is no longer whether to use AI but how to operate it well.",
    body:
      "Request a demo to review your use case, integration surface and the kind of commercial or support flow you want to activate.",
    primaryLabel: "Request demo",
    primaryPath: "/en/request-demo",
    secondaryLabel: "See integrations",
    secondaryPath: "/en/integrations",
  },
};

const FEATURES_EN: PublicPageDefinition = {
  ...FEATURES_ES,
  locale: "en",
  path: "/en/features",
  navLabel: "Platform",
  breadcrumbLabel: "Platform",
  description:
    "Talkaris capabilities for shipping embedded AI assistants with governed knowledge, multi-tenant operations and conversation analytics.",
  seoTitle: "Talkaris features | AI widget, knowledge, analytics and governance",
  seoDescription:
    "Explore Talkaris features: embeddable widget, governed knowledge ingestion, leads, analytics and multi-tenant operations.",
  seoKeywords: [
    "ai chatbot features",
    "embedded ai widget",
    "chatbot knowledge base",
    "conversation analytics platform",
    "multi tenant chatbot software",
  ],
  heroEyebrow: "Conversational platform",
  heroTitle: "Everything required to launch, measure and govern embedded AI assistants.",
  heroCopy:
    "Talkaris connects public experience, knowledge operations and platform control without forcing your team into a patchwork of tools.",
  heroSummary:
    "Features matter when they translate into less friction for the team and more visible value for the people using your website or product.",
  primaryCtaLabel: "Request demo",
  primaryCtaPath: "/en/request-demo",
  secondaryCtaLabel: "See integrations",
  secondaryCtaPath: "/en/integrations",
  leadInTitle: "Functionality that adds business value, not feature checklists for show.",
  leadInBody:
    "Every Talkaris capability exists to answer a concrete operational need: integrate faster, answer better and keep governance as usage grows.",
  leadInProofs: [
    "Project-level configuration to avoid cloned experiences.",
    "Sources managed from the console instead of fragile manual changes.",
    "Leads and conversations powered by the same technical core.",
  ],
  sections: [
    {
      ...FEATURES_ES.sections[0],
      eyebrow: "Widget and experience",
      title: "The conversational front end is ready to live inside a premium website or a serious SaaS.",
      intro:
        "The visible layer needs to convert and resolve doubts. That is why the widget is configured as an extension of the brand, not as a visual add-on.",
      cards: [
        {
          title: "Async snippet-based load",
          body: "Light integration with API-resolved configuration and compatibility with legacy aliases.",
          bullets: ["Site key per project", "Allowed domains", "No coupling between public portal and product"],
        },
        {
          title: "Branding and CTA adapted to every context",
          body: "Bot name, welcome message, commercial CTA and visual theme set at project level.",
          bullets: ["Lead generation flows", "Product-specific tone", "Alignment between marketing and support"],
        },
      ],
    },
    {
      ...FEATURES_ES.sections[1],
      eyebrow: "Knowledge and response",
      title: "Real usefulness appears when knowledge is governed.",
      intro:
        "Connecting documents is not enough. You need source control, visibility, re-indexing and traceability to keep answers useful and bounded.",
      cards: [
        {
          title: "Ingestion from sitemap, HTML, PDF and markdown",
          body: "Sources are managed from the console and become usable documents at project level.",
        },
        {
          title: "Versioning and operational traceability",
          body: "Every document keeps ingestion and version history so the team knows what the system is answering with.",
        },
        {
          title: "Tenant and project isolation",
          body: "Knowledge never bleeds across clients, applications or different digital surfaces.",
        },
      ],
    },
    {
      ...FEATURES_ES.sections[2],
      eyebrow: "Operations",
      title: "Leads, conversations and analytics in the same loop.",
      intro:
        "The goal is not just to answer. The goal is to understand what happens, detect demand and improve the system with evidence.",
      cards: [
        {
          title: "Leads with conversational context",
          body: "Commercial intent is not lost between disconnected forms and messages.",
        },
        {
          title: "Project-level analytics summary",
          body: "Events, lead states and unanswered questions highlight real content gaps.",
        },
        {
          title: "Superadmin for global health",
          body: "Branding, access, tenants and cross-tenant visibility from one governance layer.",
        },
      ],
    },
    {
      ...FEATURES_ES.sections[3],
      eyebrow: "LLM models",
      title: "You choose the model. We provide the stack.",
      intro: "OpenAI, Anthropic Claude, DeepSeek and Google Gemini available without changing the integration.",
      cards: [
        {
          title: "Native multi-model support",
          body: "Switch from GPT-4 to Claude to DeepSeek without touching your widget or knowledge base. A single selector in the cockpit.",
        },
        {
          title: "Multimodal Gemini",
          body: "Ingest video, audio, images and complex PDFs using Google Gemini. New gemini_file source type.",
        },
      ],
    },
    {
      ...FEATURES_ES.sections[4],
      eyebrow: "Ecosystem",
      title: "Connect with what you already use.",
      intro: "Webhooks, API keys, HubSpot, Zendesk, Notion, YouTube, Google Drive and more.",
      cards: [
        {
          eyebrow: "Knowledge sources",
          title: "Notion, YouTube, PDF, Sitemap",
          body: "Ingest from the sources where your content already lives without migrations or duplicates.",
        },
        {
          eyebrow: "CRM and support",
          title: "HubSpot and Zendesk",
          body: "Sync leads and tickets with your sales and support team tools.",
        },
        {
          eyebrow: "Developer API",
          title: "REST API + Webhooks",
          body: "77+ documented endpoints, scoped API keys and HMAC-signed webhooks.",
        },
      ],
    },
  ],
  timelineTitle: "Architecture ready to grow without rebuilding the whole stack.",
  timelineIntro:
    "The platform separates integration, knowledge and governance so you can move in phases without losing technical coherence.",
  timeline: [
    {
      step: "01",
      title: "Publish the experience",
      body: "Enable widget, copy, CTA and branding on the surface that creates the most immediate impact.",
    },
    {
      step: "02",
      title: "Connect knowledge and measurement",
      body: "Feed the system with useful documentation and start reading conversations and leads with context.",
    },
    {
      step: "03",
      title: "Scale across products or clients",
      body: "Activate project isolation, tenants and superadmin control to run as a platform.",
    },
  ],
  ctaPanel: {
    eyebrow: "Demo",
    title: "Review the features against a concrete use case, not against an abstract checklist.",
    body:
      "In the demo we map the platform to your site, your product and your actual support or sales operation.",
    primaryLabel: "Request demo",
    primaryPath: "/en/request-demo",
    secondaryLabel: "See use cases",
    secondaryPath: "/en/use-cases",
  },
};

const INTEGRATIONS_EN: PublicPageDefinition = {
  ...INTEGRATIONS_ES,
  locale: "en",
  path: "/en/integrations",
  description:
    "How Talkaris integrates into corporate websites, SaaS applications, help centers, private portals and pre-sales or support flows.",
  seoTitle: "Talkaris integrations | AI chatbot for websites, SaaS and support portals",
  seoDescription:
    "See how Talkaris integrates into corporate websites, SaaS products and operational portals with an embeddable governed AI widget.",
  seoKeywords: [
    "ai chatbot integration website",
    "chatbot for saas",
    "ai assistant for private portal",
    "support chatbot integration",
    "pre sales ai assistant",
  ],
  heroEyebrow: "Deployment contexts",
  heroTitle: "One platform. Several conversational surfaces handled properly.",
  heroCopy:
    "Talkaris is ready to live inside a corporate website, a SaaS, an extranet or a support portal while keeping the experience coherent with the operation underneath.",
  heroSummary:
    "Good integration means respecting the context of each surface while preserving a consistent technical layer below it.",
  primaryCtaLabel: "Request demo",
  primaryCtaPath: "/en/request-demo",
  secondaryCtaLabel: "Explore platform",
  secondaryCtaPath: "/en/features",
  leadInTitle: "Integration context matters as much as the model.",
  leadInBody:
    "You do not talk the same way on a marketing landing page and in an operational portal. Talkaris adapts the experience without multiplying internal complexity.",
  leadInProofs: [
    "Surface-specific messaging and CTA.",
    "Allowed domains and isolated configuration.",
    "Unified operation even when the experience changes.",
  ],
  sections: [
    {
      ...INTEGRATIONS_ES.sections[0],
      eyebrow: "Corporate website",
      title: "A commercial landing page can sell better when the conversation is designed properly.",
      intro:
        "Talkaris helps explain value, handle objections and guide people toward a demo without breaking the browsing experience or sounding robotic.",
      cards: [
        {
          title: "Commercial assistance above the fold",
          body: "The site explains what you do and the assistant resolves key questions at the right moment.",
        },
        {
          title: "CTA aligned with intent",
          body: "Not every visitor needs the same next step. Talkaris can push demo, contact or review depending on context.",
        },
      ],
    },
    {
      ...INTEGRATIONS_ES.sections[1],
      eyebrow: "SaaS product",
      title: "The same core supports onboarding, support and expansion inside the product.",
      intro:
        "A useful in-product assistant reduces friction, accelerates onboarding and opens adoption opportunities without defaulting to tickets or calls.",
      cards: [
        {
          title: "Contextual help on critical screens",
          body: "Support for onboarding, setup or complex modules inside the product flow itself.",
        },
        {
          title: "Answers grounded in real documentation",
          body: "The knowledge base is governed from the console and can change without touching the front end.",
        },
        {
          title: "Scale across modules, products or tenants",
          body: "Especially useful when the company operates more than one app or more than one brand.",
        },
      ],
    },
    {
      ...INTEGRATIONS_ES.sections[2],
      eyebrow: "Portals and support",
      title: "It also fits environments where precision and governance matter more than marketing.",
      intro:
        "Help centers, private areas, extranets or document-heavy portals benefit from a conversational layer only if operational control exists behind it.",
      cards: [
        {
          title: "Extranets and customer areas",
          body: "Support over procedures, documentation or high-volume recurring questions.",
        },
        {
          title: "Technical documentation",
          body: "Answers grounded on authorised and versioned HTML, PDF or markdown content.",
        },
        {
          title: "Capture operational signals",
          body: "Unanswered questions and lead intent help improve content and flows over time.",
        },
      ],
    },
    {
      ...INTEGRATIONS_ES.sections[3],
      eyebrow: "For developers",
      title: "REST API + Webhooks + Widget SDK.",
      intro: "Build on Talkaris with clear documentation, scoped API keys and HMAC-signed webhooks.",
      cards: [
        {
          eyebrow: "REST API",
          title: "77+ documented endpoints",
          body: "Manage projects, bots, knowledge and conversations from your infrastructure using Bearer auth.",
        },
        {
          eyebrow: "Webhooks",
          title: "Real-time event push",
          body: "Receive conversation, lead and ingestion events with HMAC-signed payload for secure validation.",
        },
        {
          eyebrow: "Widget SDK",
          title: "Public postMessage API",
          body: "Control the widget from the host page: open, close, send context and listen to events.",
        },
      ],
    },
  ],
  ctaPanel: {
    eyebrow: "Fit",
    title: "The best integration is not the flashiest one. It is the one that fits your surface and your operation.",
    body:
      "Request a demo and we will review the best entry point for Talkaris across your website, product or support workflow.",
    primaryLabel: "Request demo",
    primaryPath: "/en/request-demo",
    secondaryLabel: "See FAQ",
    secondaryPath: "/en/faq",
  },
};

const USE_CASES_EN: PublicPageDefinition = {
  ...USE_CASES_ES,
  locale: "en",
  path: "/en/use-cases",
  description:
    "Talkaris use cases for pre-sales, support, onboarding, documentation and multi-brand or multi-product operations.",
  seoTitle: "Talkaris use cases | Pre-sales, support, onboarding and documentation",
  seoDescription:
    "Explore Talkaris use cases for pre-sales, support, onboarding, help centers and multi-product operations.",
  seoKeywords: [
    "ai chatbot use cases",
    "pre sales ai assistant",
    "support ai chatbot",
    "saas onboarding assistant",
    "conversational ai for documentation",
  ],
  heroEyebrow: "Practical applications",
  heroTitle: "Pre-sales, support, onboarding and documentation: where conversation creates real value.",
  heroCopy:
    "Talkaris performs best when it starts from a clear goal. Every use case defines what the assistant should resolve, which objections it should handle and what action it should trigger.",
  heroSummary:
    "That clarity is the difference between a useful conversation and an experience that distracts, confuses or simply fails to convert.",
  primaryCtaLabel: "Request demo",
  primaryCtaPath: "/en/request-demo",
  secondaryCtaLabel: "See integrations",
  secondaryCtaPath: "/en/integrations",
  leadInTitle: "One product, several problems solved with precision.",
  leadInBody:
    "Talkaris does not try to be the flashiest chatbot. It competes to be the solution that best connects conversation, content and next step depending on the user moment.",
  leadInProofs: [
    "Commercial responses for early funnel phases.",
    "Contextual support to reduce operational friction.",
    "Enough governance to deploy across several business lines.",
  ],
  sections: [
    {
      ...USE_CASES_ES.sections[0],
      eyebrow: "Pre-sales",
      title: "Explain complex value better and detect real intent.",
      intro:
        "When the value proposition needs context, a good conversation shortens the distance between visit and demo.",
      cards: [
        {
          title: "Filter recurring objections",
          body: "Answer scope, integration, timing or fit questions before the visitor drops off.",
        },
        {
          title: "Commercial CTA with more context",
          body: "Route to demo or review with signals captured inside the conversation.",
        },
        {
          title: "Greater commercial clarity",
          body: "Especially useful when the solution is powerful but difficult to understand in a single read.",
        },
      ],
    },
    {
      ...USE_CASES_ES.sections[1],
      eyebrow: "Support and documentation",
      title: "Reduce friction when the user is already inside and needs to keep moving.",
      intro:
        "Here the goal is not to impress. It is to help accurately, quickly and with authorised knowledge.",
      cards: [
        {
          title: "Help centers and knowledge hubs",
          body: "Add conversational access to documentation that already exists but is hard to navigate today.",
        },
        {
          title: "Private portals and extranets",
          body: "Contextual assistance around procedures, rules or repetitive operational tasks.",
        },
        {
          title: "Detect content gaps",
          body: "Unanswered questions highlight what should be improved in the documentation layer.",
        },
      ],
    },
    {
      ...USE_CASES_ES.sections[2],
      eyebrow: "Onboarding and adoption",
      title: "Conversation can also accelerate time-to-value.",
      intro:
        "Inside the product, Talkaris can guide early steps, clarify setup and reduce abandonment in first-use flows.",
      cards: [
        {
          title: "Guided onboarding",
          body: "Resolve common questions without forcing people out of the product flow or into scattered docs.",
        },
        {
          title: "Expansion to modules or higher plans",
          body: "When relevant, the assistant can also detect upsell or feature activation opportunities.",
        },
      ],
    },
    {
      ...USE_CASES_ES.sections[3],
      eyebrow: "Channels",
      title: "The same bot, on your website and on Telegram.",
      intro: "Connect your assistant to Telegram with a token. The same knowledge and conversational policy, on another channel.",
      cards: [
        {
          title: "Telegram without additional code",
          body: "Configure the Telegram channel from the cockpit with your bot token. Widget and Telegram share the same knowledge base and conversation flow.",
          bullets: ["One token, active channel", "Same governed knowledge", "Conversations in the same console"],
        },
        {
          title: "Multi-channel, single governance",
          body: "Manage all channels from the same operations panel. Conversations, leads and analytics unified regardless of where the user came from.",
          bullets: ["Web + Telegram + future integrations", "Unified analytics", "Scalable to more channels"],
        },
      ],
    },
  ],
  ctaPanel: {
    eyebrow: "Application",
    title: "If the use case is clear, conversational value can appear surprisingly fast.",
    body:
      "Request a demo and we will review which use case you should attack first to get real impact with the leanest deployment.",
    primaryLabel: "Request demo",
    primaryPath: "/en/request-demo",
    secondaryLabel: "See platform",
    secondaryPath: "/en/features",
  },
};

const FAQ_EN: PublicPageDefinition = {
  ...FAQ_ES,
  locale: "en",
  path: "/en/faq",
  title: "Frequently asked questions about Talkaris",
  description:
    "Frequently asked questions about integration, multi-tenant architecture, governed knowledge and Talkaris deployment.",
  seoTitle: "Talkaris FAQ | Integration, knowledge, multi-tenant and deployment",
  seoDescription:
    "Answers to the most common questions about Talkaris integration, knowledge ingestion, multi-tenant operation and deployment.",
  seoKeywords: [
    "chatbot faq",
    "talkaris faq",
    "ai assistant integration faq",
    "multi tenant chatbot faq",
    "knowledge ingestion ai faq",
  ],
  heroEyebrow: "Straight answers",
  heroTitle: "The important things about Talkaris, without vagueness or hype.",
  heroCopy:
    "If you are evaluating a serious conversational platform, these are the questions that usually show up before a demo or an implementation discussion.",
  heroSummary:
    "The goal is to help you understand the technical and operational fit before moving to a review of your specific case.",
  primaryCtaLabel: "Request demo",
  primaryCtaPath: "/en/request-demo",
  secondaryCtaLabel: "Back to home",
  secondaryCtaPath: "/en",
  leadInTitle: "The useful questions are usually the ones that ground the decision.",
  leadInBody:
    "We prioritised questions that clarify how Talkaris fits a real operation, not filler questions made only to pad SEO pages.",
  leadInProofs: [
    "Specific and maintainable answers.",
    "Aligned with the real product and current architecture.",
    "Useful both for conversion and organic discoverability.",
  ],
  sections: [
    {
      ...FAQ_ES.sections[0],
      title: "Questions that usually determine whether there is fit or not.",
      intro:
        "Use this section as an initial filter. If the fit is there, the next step is a demo grounded in your real context.",
      cards: [
        {
          title: "Integration and deployment",
          body: "How the widget is enabled, which surfaces it supports and how much project-level configuration exists.",
        },
        {
          title: "Knowledge, operations and governance",
          body: "What content can be ingested, how it is managed and what control layers are available.",
        },
      ],
    },
  ],
  faqs: [
    {
      question: "How is Talkaris integrated into a website or application?",
      answer:
        "Through the widget snippet, a project site key and allowed domains. Branding, CTA and operational configuration are resolved from the platform.",
    },
    {
      question: "What content can it use to answer?",
      answer:
        "It currently ingests sitemap, HTML, PDF and markdown. Sources are managed from the console and can be re-indexed when content changes.",
    },
    {
      question: "Can it run across several websites or products at once?",
      answer:
        "Yes. The multi-tenant and multi-project architecture keeps branding, knowledge, domains and analytics isolated for every integration.",
    },
    {
      question: "Is it useful for support in addition to commercial capture?",
      answer:
        "Yes. Talkaris is designed for pre-sales, support, onboarding, documentation and other flows where conversation needs useful context and operational control.",
    },
    {
      question: "Who controls access and global configuration?",
      answer:
        "The superadmin layer centralises branding, access review, tenants, users and platform-wide visibility while each tenant operates its own day-to-day console.",
    },
    {
      question: "Is the public demo decorative or does it reflect the real product?",
      answer:
        "It reflects the same technical integration contract that real projects use, so it is an honest way to validate the experience.",
    },
  ],
  ctaPanel: {
    eyebrow: "Next step",
    title: "If your question is not listed here, it probably deserves a demo with your own context on the table.",
    body:
      "Request a demo and we will review integration, use case, required content and rollout criteria without the usual hype.",
    primaryLabel: "Request demo",
    primaryPath: "/en/request-demo",
    secondaryLabel: "See integrations",
    secondaryPath: "/en/integrations",
  },
};

const BLOG_EN: PublicPageDefinition = {
  ...BLOG_ES,
  locale: "en",
  path: "/en/blog",
  description:
    "Editorial content on conversational AI, website and SaaS chatbots, knowledge operations and conversational strategy.",
  seoTitle: "Talkaris blog | Conversational AI, SaaS chatbots and knowledge operations",
  seoDescription:
    "Guides and analysis on conversational AI, website and product chatbots, knowledge operations and better deployment practices.",
  seoKeywords: [
    "conversational ai blog",
    "saas chatbot blog",
    "knowledge operations blog",
    "corporate website chatbot",
    "b2b conversational strategy",
  ],
  heroEyebrow: "Editorial content",
  heroTitle: "Guides, ideas and practical judgement for teams shipping conversational AI with intent.",
  heroCopy:
    "The Talkaris blog is built for teams that need to integrate, govern and monetise conversational experiences across websites, products and support operations.",
  heroSummary:
    "We do not aim for shallow content. We aim for pieces that help people understand the stack, the strategy and the implementation tradeoffs.",
  primaryCtaLabel: "Request demo",
  primaryCtaPath: "/en/request-demo",
  secondaryCtaLabel: "See platform",
  secondaryCtaPath: "/en/features",
  leadInTitle: "A useful SEO base starts with content that serves both the audience and the business.",
  leadInBody:
    "The editorial layer is designed to target commercial and informational intent without cannibalising the main value proposition or drifting into artificial SEO.",
  leadInProofs: [
    "Coverage for both commercial and informational intent.",
    "Natural internal links toward platform, integrations and demo.",
    "A structure that can grow without breaking design or hierarchy.",
  ],
  sections: [
    {
      ...BLOG_ES.sections[0],
      eyebrow: "Editorial tracks",
      title: "Three content territories to build useful authority.",
      intro:
        "While the blog continues to be populated from Auctorio, these are the editorial tracks planned to expand semantic relevance with clear business alignment.",
      cards: [
        {
          title: "Conversational AI for B2B growth",
          body: "Pieces on demand capture, qualification, support, onboarding and brand experience.",
        },
        {
          title: "Technical integration across websites and SaaS",
          body: "Content on embeddable widgets, governed knowledge, allowed domains and multi-project operations.",
        },
        {
          title: "Governance, content and performance",
          body: "Best practices on architecture, SEO, structured data and knowledge operations.",
        },
      ],
    },
  ],
  ctaPanel: {
    eyebrow: "Conversion",
    title: "If the content clarifies fit, the next conversation should be about your actual implementation.",
    body:
      "Request a demo and we will map conversational strategy to your website, product or support stack.",
    primaryLabel: "Request demo",
    primaryPath: "/en/request-demo",
    secondaryLabel: "See use cases",
    secondaryPath: "/en/use-cases",
  },
};

const PRICING_ES: PublicPageDefinition = {
  key: "pricing",
  locale: "es",
  path: "/precios",
  navLabel: "Precios",
  breadcrumbLabel: "Precios",
  title: "Precios Talkaris",
  description: "Planes de Talkaris para equipos B2B que quieren desplegar IA conversacional sin sorpresas ni contratos eternos.",
  seoTitle: "Precios Talkaris | Plataforma IA conversacional",
  seoDescription: "Consulta los precios de Talkaris: Starter desde 149€/mes, Growth desde 399€/mes y Enterprise a medida. Sin permanencia, sin sorpresas.",
  seoKeywords: [
    "precios chatbot ia",
    "coste plataforma conversacional",
    "precio chatbot empresa",
    "cuánto cuesta chatbot ia",
    "precio asistente virtual empresa",
  ],
  heroEyebrow: "Precios transparentes",
  heroTitle: "Un precio por proyecto. Sin sorpresas.",
  heroCopy: "Talkaris se estructura en planes claros para que sepas exactamente qué incluye cada nivel desde el primer día.",
  heroSummary: "Sin contratos eternos, sin letra pequeña. Empieza con un proyecto y escala cuando tu operación lo requiera.",
  heroBadges: ["Sin permanencia", "Sin costes ocultos", "Escalable"],
  heroStats: [
    { value: "149€", label: "Plan Starter desde", detail: "1 proyecto, widget, fuentes básicas y 1k conversaciones al mes." },
    { value: "399€", label: "Plan Growth desde", detail: "Hasta 5 proyectos, todas las fuentes, handover humano y API." },
    { value: "A medida", label: "Plan Enterprise", detail: "Multi-tenant completo, whitelabeling, SLA y onboarding dedicado." },
  ],
  heroImage: "/assets/talkaris-hero-campaign.png",
  heroImageAlt: "Visual de precios transparentes de Talkaris",
  primaryCtaLabel: "Solicitar demo",
  primaryCtaPath: "/solicitar-demo",
  secondaryCtaLabel: "Ver funcionalidades",
  secondaryCtaPath: "/funcionalidades",
  indexable: true,
  leadInTitle: "Precios pensados para proyectos reales, no para capturar presupuesto.",
  leadInBody: "Cada plan refleja un nivel de uso real. El objetivo es que empieces con lo que necesitas y crezcas sin cambiar de herramienta.",
  leadInProofs: [
    "Sin coste de setup ni permanencia mínima.",
    "Cambio de plan en cualquier momento sin penalización.",
    "Acceso completo a producción en 48h si hay fit.",
  ],
  sections: [
    {
      id: "plans",
      eyebrow: "Planes",
      title: "Elige el nivel que se adapta a tu operación.",
      intro: "Tres planes con alcance diferenciado para que el coste siempre tenga sentido.",
      layout: "three-up",
      cards: [
        {
          eyebrow: "Starter",
          title: "Desde 149€/mes",
          body: "Para equipos que quieren desplegar su primer asistente de IA de forma seria sin grandes compromisos.",
          bullets: ["1 proyecto activo", "Widget embebido configurable", "Fuentes: Sitemap, HTML, PDF", "1.000 conversaciones/mes", "Hasta 5 usuarios", "Soporte por email"],
        },
        {
          eyebrow: "Growth",
          title: "Desde 399€/mes",
          body: "Para equipos que operan varios productos o superficies y necesitan el stack completo.",
          bullets: ["Hasta 5 proyectos activos", "Todas las fuentes: YouTube, Notion, Gemini File", "10.000 conversaciones/mes", "Hasta 20 usuarios", "Handover humano", "Analytics avanzado + Webhooks + API keys"],
          metric: "Más popular",
        },
        {
          eyebrow: "Enterprise",
          title: "A medida",
          body: "Para plataformas multi-tenant, agencias o empresas con requisitos de SLA, whitelabeling e integraciones CRM.",
          bullets: ["Proyectos ilimitados", "Multi-tenant completo", "SLA garantizado", "Whitelabeling de widget", "Integraciones HubSpot y Zendesk", "Onboarding dedicado"],
        },
      ],
    },
    {
      id: "faq-pricing",
      eyebrow: "Preguntas sobre precios",
      title: "Dudas habituales antes de decidir.",
      intro: "Si tienes más preguntas, respóndelas en la demo.",
      layout: "three-up",
      cards: [
        { title: "¿Hay permanencia mínima?", body: "No. Puedes cancelar en cualquier momento sin penalización. No cobramos setup ni onboarding en los planes Starter y Growth." },
        { title: "¿Se puede cambiar de plan?", body: "Sí. El cambio de plan es inmediato y el ajuste de facturación se prorratea en el siguiente ciclo." },
        { title: "¿Hay free trial?", body: "No ofrecemos trial genérico, pero sí demos orientadas a tu caso. Si hay fit técnico, puedes tener entorno de pruebas en 48h." },
      ],
    },
  ],
  timelineTitle: "Cómo empezar con Talkaris esta semana.",
  timelineIntro: "El proceso está diseñado para que vayas de cero a producción sin sorpresas.",
  timeline: [
    { step: "01", title: "Solicita la demo", body: "Revisamos tu caso, la superficie y el nivel de operación que necesitas para recomendarte el plan correcto." },
    { step: "02", title: "Acceso en 48h si hay fit", body: "Si hay encaje técnico y comercial, tienes entorno activo en menos de 48 horas." },
    { step: "03", title: "Escala cuando lo necesites", body: "Cambia de plan sin fricción cuando el uso lo justifique. El conocimiento y la configuración se mantienen." },
  ],
  faqs: [
    { question: "¿El precio incluye el widget y el cockpit?", answer: "Sí. El precio mensual incluye acceso al cockpit de operación, el widget embebible y las funcionalidades del plan contratado sin costes adicionales." },
    { question: "¿Qué ocurre si supero el límite de conversaciones?", answer: "Te avisamos antes de llegar al límite. Puedes ampliar el plan o contratar conversaciones adicionales sin interrumpir el servicio." },
    { question: "¿Los datos de mis conversaciones son privados?", answer: "Sí. El aislamiento multi-tenant garantiza que tus conversaciones, conocimiento y leads no son accesibles por otros tenants de la plataforma." },
  ],
  ctaPanel: {
    eyebrow: "Siguiente paso",
    title: "La mejor forma de entender el precio es verlo aplicado a tu caso.",
    body: "Solicita la demo y en 30 minutos sabrás qué plan se ajusta a tu operación y cuánto tiempo tardarías en estar en producción.",
    primaryLabel: "Solicitar demo",
    primaryPath: "/solicitar-demo",
    secondaryLabel: "Ver funcionalidades",
    secondaryPath: "/funcionalidades",
  },
};

const PRICING_EN: PublicPageDefinition = {
  ...PRICING_ES,
  locale: "en",
  path: "/en/pricing",
  navLabel: "Pricing",
  breadcrumbLabel: "Pricing",
  title: "Talkaris Pricing",
  description: "Talkaris plans for B2B teams that want to deploy conversational AI without surprises or eternal contracts.",
  seoTitle: "Talkaris Pricing | Conversational AI Platform",
  seoDescription: "Talkaris pricing: Starter from €149/month, Growth from €399/month and Enterprise custom. No lock-in, no surprises.",
  seoKeywords: ["ai chatbot pricing", "conversational platform cost", "enterprise chatbot price", "ai assistant cost", "chatbot saas pricing"],
  heroEyebrow: "Transparent pricing",
  heroTitle: "One price per project. No surprises.",
  heroCopy: "Talkaris is structured in clear plans so you know exactly what each tier includes from day one.",
  heroSummary: "No eternal contracts, no fine print. Start with one project and scale when your operation requires it.",
  heroBadges: ["No lock-in", "No hidden costs", "Scalable"],
  heroStats: [
    { value: "€149", label: "Starter plan from", detail: "1 project, widget, basic sources and 1k conversations per month." },
    { value: "€399", label: "Growth plan from", detail: "Up to 5 projects, all sources, human handover and API." },
    { value: "Custom", label: "Enterprise plan", detail: "Full multi-tenant, whitelabeling, SLA and dedicated onboarding." },
  ],
  heroImageAlt: "Talkaris transparent pricing visual",
  primaryCtaLabel: "Request demo",
  primaryCtaPath: "/en/request-demo",
  secondaryCtaLabel: "See features",
  secondaryCtaPath: "/en/features",
  leadInTitle: "Pricing designed for real projects, not budget capture.",
  leadInBody: "Each plan reflects a real usage level. The goal is for you to start with what you need and grow without changing tools.",
  leadInProofs: ["No setup cost or minimum commitment.", "Plan changes at any time without penalty.", "Full production access in 48h if there is fit."],
  sections: [
    {
      id: "plans",
      eyebrow: "Plans",
      title: "Choose the level that fits your operation.",
      intro: "Three plans with differentiated scope so the cost always makes sense.",
      layout: "three-up",
      cards: [
        {
          eyebrow: "Starter",
          title: "From €149/month",
          body: "For teams that want to deploy their first AI assistant seriously without big commitments.",
          bullets: ["1 active project", "Configurable embedded widget", "Sources: Sitemap, HTML, PDF", "1,000 conversations/month", "Up to 5 users", "Email support"],
        },
        {
          eyebrow: "Growth",
          title: "From €399/month",
          body: "For teams operating multiple products or surfaces that need the full stack.",
          bullets: ["Up to 5 active projects", "All sources: YouTube, Notion, Gemini File", "10,000 conversations/month", "Up to 20 users", "Human handover", "Advanced analytics + Webhooks + API keys"],
          metric: "Most popular",
        },
        {
          eyebrow: "Enterprise",
          title: "Custom",
          body: "For multi-tenant platforms, agencies or companies with SLA, whitelabeling and CRM integration requirements.",
          bullets: ["Unlimited projects", "Full multi-tenant", "Guaranteed SLA", "Widget whitelabeling", "HubSpot and Zendesk integrations", "Dedicated onboarding"],
        },
      ],
    },
    {
      id: "faq-pricing",
      eyebrow: "Pricing questions",
      title: "Common questions before deciding.",
      intro: "If you have more questions, answer them in the demo.",
      layout: "three-up",
      cards: [
        { title: "Is there a minimum commitment?", body: "No. You can cancel at any time without penalty. We do not charge setup or onboarding fees on Starter and Growth plans." },
        { title: "Can I change plans?", body: "Yes. Plan changes are immediate and billing adjustments are prorated in the next cycle." },
        { title: "Is there a free trial?", body: "We do not offer a generic trial, but we do offer demos tailored to your case. If there is technical fit, you can have a test environment in 48h." },
      ],
    },
  ],
  timelineTitle: "How to get started with Talkaris this week.",
  timelineIntro: "The process is designed to take you from zero to production without surprises.",
  timeline: [
    { step: "01", title: "Request the demo", body: "We review your case, the surface and the level of operation you need to recommend the right plan." },
    { step: "02", title: "Access in 48h if there is fit", body: "If there is technical and commercial fit, you have an active environment in less than 48 hours." },
    { step: "03", title: "Scale when you need it", body: "Change plans without friction when usage justifies it. Knowledge and configuration are preserved." },
  ],
  faqs: [
    { question: "Does the price include the widget and the cockpit?", answer: "Yes. The monthly price includes access to the operations cockpit, the embeddable widget and the features of the contracted plan with no additional costs." },
    { question: "What happens if I exceed the conversation limit?", answer: "We notify you before reaching the limit. You can upgrade the plan or purchase additional conversations without interrupting the service." },
    { question: "Is my conversation data private?", answer: "Yes. Multi-tenant isolation ensures that your conversations, knowledge and leads are not accessible by other platform tenants." },
  ],
  ctaPanel: {
    eyebrow: "Next step",
    title: "The best way to understand pricing is to see it applied to your case.",
    body: "Request the demo and in 30 minutes you will know which plan fits your operation and how long it would take to go live.",
    primaryLabel: "Request demo",
    primaryPath: "/en/request-demo",
    secondaryLabel: "See features",
    secondaryPath: "/en/features",
  },
};

const CUSTOMERS_ES: PublicPageDefinition = {
  key: "customers",
  locale: "es",
  path: "/clientes",
  navLabel: "Clientes",
  breadcrumbLabel: "Clientes",
  title: "Clientes y casos de éxito de Talkaris",
  description: "Equipos B2B que ya operan con Talkaris: SaaS, e-commerce B2B y portales internos que activaron IA conversacional en producción.",
  seoTitle: "Clientes Talkaris | Casos de uso IA conversacional en producción",
  seoDescription: "Descubre cómo empresas B2B usan Talkaris para activar asistentes IA en web, producto y soporte. Resultados reales, sin demos vacías.",
  seoKeywords: ["casos de uso chatbot ia", "clientes plataforma ia conversacional", "resultados chatbot empresa", "ejemplos chatbot b2b", "casos exito asistente ia"],
  heroEyebrow: "Casos reales",
  heroTitle: "Equipos que ya operan con Talkaris.",
  heroCopy: "De la web corporativa al portal interno. Empresas B2B que decidieron activar IA conversacional con criterio y sin improvisar.",
  heroSummary: "Cada caso de uso refleja una decisión operativa concreta: qué superficie activar, qué conocimiento gobernar y qué resultado medir.",
  heroBadges: ["SaaS", "E-commerce B2B", "Portales internos"],
  heroStats: [
    { value: "40%", label: "Reducción de tickets de soporte", detail: "SaaS de gestión que activó onboarding conversacional en su producto." },
    { value: "3×", label: "Más demos cualificadas", detail: "E-commerce B2B que desplegó asistente en su web pública." },
    { value: "2h", label: "Hasta knowledge base en producción", detail: "Portal interno que indexó su documentación completa en una tarde." },
  ],
  heroImage: "/assets/talkaris-editorial-campaign.png",
  heroImageAlt: "Equipos de empresa usando Talkaris para operar asistentes IA",
  primaryCtaLabel: "Solicitar demo",
  primaryCtaPath: "/solicitar-demo",
  secondaryCtaLabel: "Ver funcionalidades",
  secondaryCtaPath: "/funcionalidades",
  indexable: true,
  leadInTitle: "IA conversacional que resuelve casos de uso reales.",
  leadInBody: "No hay un único patrón de implantación. Hay equipos que empiezan por captación, otros por soporte y otros por documentación interna. Todos llegan a producción.",
  leadInProofs: [
    "Web corporativa: captación y calificación de demanda.",
    "Producto SaaS: onboarding, ayuda contextual y upsell.",
    "Portal interno: documentación accesible sin búsquedas manuales.",
  ],
  sections: [
    {
      id: "case-saas",
      eyebrow: "SaaS de gestión",
      title: "Onboarding conversacional que redujo tickets un 40%.",
      intro: "Un SaaS de software de gestión activó Talkaris en su producto para guiar a nuevos usuarios durante el onboarding. El asistente responde dudas de configuración y detecta usuarios bloqueados antes de que escalen a soporte.",
      layout: "two-up",
      cards: [
        { eyebrow: "Problema", title: "Demasiadas preguntas de configuración básica en soporte", body: "El volumen de tickets bloqueaba al equipo y ralentizaba la adopción de nuevos usuarios." },
        { eyebrow: "Resultado", title: "−40% tickets en 30 días, NPS de onboarding mejorado", body: "El asistente resuelve el 80% de las preguntas frecuentes. El equipo de soporte se centra en casos complejos.", metric: "−40% tickets" },
      ],
    },
    {
      id: "case-ecommerce",
      eyebrow: "E-commerce B2B",
      title: "3x más demos cualificadas desde la web pública.",
      intro: "Un e-commerce B2B desplegó el asistente de Talkaris en su web pública para calificar visitantes y orientarlos hacia la demo correcta según su perfil de compra.",
      layout: "two-up",
      cards: [
        { eyebrow: "Problema", title: "Alta tasa de rebote sin conversión clara", body: "Los visitantes llegaban con preguntas pero no encontraban respuestas rápidas y se iban." },
        { eyebrow: "Resultado", title: "3x más demos cualificadas por semana", body: "El asistente filtra intención de compra y ofrece CTA contextualizado al perfil del visitante.", metric: "3× pipeline" },
      ],
    },
    {
      id: "case-internal",
      eyebrow: "Portal interno",
      title: "Conocimiento de empresa indexado en 2 horas.",
      intro: "Un equipo de 50 personas necesitaba acceder a documentación técnica y procesos internos sin depender de búsquedas manuales ni interrumpir a los expertos.",
      layout: "two-up",
      cards: [
        { eyebrow: "Problema", title: "Documentación dispersa en Notion, PDFs y carpetas compartidas", body: "El conocimiento existía pero nadie lo encontraba. Las preguntas las respondían siempre los mismos expertos." },
        { eyebrow: "Resultado", title: "Knowledge base unificado con respuesta instantánea", body: "Ingestión de fuentes Notion, PDF y sitemap interno en una tarde. El asistente responde en menos de 2 segundos.", metric: "2h → producción" },
      ],
    },
    {
      id: "industries",
      eyebrow: "Sectores",
      title: "Talkaris funciona donde hay conocimiento y conversación.",
      intro: "No hay un sector exclusivo. Hay patrones de uso que se repiten en industrias distintas.",
      layout: "three-up",
      cards: [
        { eyebrow: "SaaS", title: "Onboarding y soporte en producto", body: "Reduce tickets de configuración y mejora la adopción con asistencia contextual en el flujo del usuario." },
        { eyebrow: "E-commerce B2B", title: "Captación y calificación en web", body: "Convierte visitas con intención en conversaciones cualificadas y demos orientadas al perfil del comprador." },
        { eyebrow: "Consultoría", title: "Portales de cliente y documentación", body: "Centraliza el conocimiento de proyectos y procesos en un asistente accesible sin fricción para el equipo." },
        { eyebrow: "EdTech", title: "Soporte al aprendizaje", body: "Responde dudas de contenido, navega el catálogo y acompaña al estudiante sin depender del tutor." },
        { eyebrow: "Healthcare", title: "Información y derivación", body: "Ofrece información estructurada, filtra consultas y deriva a profesional cuando es necesario con trazabilidad." },
        { eyebrow: "Legal y compliance", title: "Acceso a normativa interna", body: "El equipo consulta políticas, procedimientos y normativa sin interrumpir al departamento jurídico." },
      ],
    },
  ],
  timelineTitle: "El proceso para llegar a producción esta semana.",
  timelineIntro: "Sin proyectos eternos ni integraciones complejas.",
  timeline: [
    { step: "01", title: "Demo orientada a tu caso", body: "Revisamos qué superficie activar, qué conocimiento tienes disponible y qué resultado quieres medir." },
    { step: "02", title: "Configuración y snippet en 1 día", body: "Widget, knowledge base y política conversacional configurados. Un snippet para integrarlo en tu web o producto." },
    { step: "03", title: "Operación y mejora continua", body: "Conversaciones, leads y analítica desde consola. Mejoras de conocimiento sin tocar código." },
  ],
  faqs: [
    { question: "¿Los casos de uso son reales?", answer: "Son casos basados en patrones de implantación reales, representados con nombres ficticios para respetar la confidencialidad." },
    { question: "¿Puedo ver una demo con mi caso de uso concreto?", answer: "Sí. La demo de Talkaris está orientada a tu superficie y objetivo real, no es una presentación genérica." },
    { question: "¿Cuánto tiempo tarda una implantación real?", answer: "Entre 1 y 5 días dependiendo de la complejidad del conocimiento y la superficie. El widget en web se puede activar en horas." },
  ],
  ctaPanel: {
    eyebrow: "¿Tu empresa es la siguiente?",
    title: "¿Quieres ser el siguiente caso de éxito?",
    body: "Solicita la demo y en 30 minutos evaluamos si Talkaris es el encaje correcto para tu web, producto o portal.",
    primaryLabel: "Solicitar demo",
    primaryPath: "/solicitar-demo",
    secondaryLabel: "Ver precios",
    secondaryPath: "/precios",
  },
};

const CUSTOMERS_EN: PublicPageDefinition = {
  ...CUSTOMERS_ES,
  locale: "en",
  path: "/en/customers",
  navLabel: "Customers",
  breadcrumbLabel: "Customers",
  title: "Talkaris Customer Stories",
  description: "B2B teams already running on Talkaris: SaaS, B2B e-commerce and internal portals that activated conversational AI in production.",
  seoTitle: "Talkaris Customers | Conversational AI Use Cases in Production",
  seoDescription: "Discover how B2B companies use Talkaris to activate AI assistants on web, product and support. Real results, no empty demos.",
  seoKeywords: ["ai chatbot use cases", "conversational ai customers", "chatbot results enterprise", "b2b chatbot examples", "ai assistant success stories"],
  heroEyebrow: "Real cases",
  heroTitle: "Teams already running on Talkaris.",
  heroCopy: "From corporate website to internal portal. B2B companies that activated conversational AI with intent and without improvising.",
  heroSummary: "Each use case reflects a concrete operational decision: which surface to activate, which knowledge to govern and which result to measure.",
  heroBadges: ["SaaS", "B2B E-commerce", "Internal portals"],
  heroStats: [
    { value: "40%", label: "Support ticket reduction", detail: "Management SaaS that activated conversational onboarding in their product." },
    { value: "3×", label: "More qualified demos", detail: "B2B e-commerce that deployed an assistant on their public website." },
    { value: "2h", label: "To knowledge base in production", detail: "Internal portal that indexed their complete documentation in an afternoon." },
  ],
  heroImageAlt: "Business teams using Talkaris to operate AI assistants",
  primaryCtaLabel: "Request demo",
  primaryCtaPath: "/en/request-demo",
  secondaryCtaLabel: "See features",
  secondaryCtaPath: "/en/features",
  leadInTitle: "Conversational AI that solves real use cases.",
  leadInBody: "There is no single deployment pattern. Some teams start with lead capture, others with support and others with internal documentation. All reach production.",
  leadInProofs: ["Corporate website: lead capture and qualification.", "SaaS product: onboarding, contextual help and upsell.", "Internal portal: accessible documentation without manual searches."],
  sections: [
    {
      id: "case-saas",
      eyebrow: "Management SaaS",
      title: "Conversational onboarding that reduced tickets by 40%.",
      intro: "A management software SaaS activated Talkaris in their product to guide new users during onboarding. The assistant answers configuration questions and detects blocked users before they escalate to support.",
      layout: "two-up",
      cards: [
        { eyebrow: "Problem", title: "Too many basic configuration questions in support", body: "The ticket volume blocked the team and slowed adoption of new users." },
        { eyebrow: "Result", title: "−40% tickets in 30 days, improved onboarding NPS", body: "The assistant resolves 80% of frequent questions. The support team focuses on truly complex cases.", metric: "−40% tickets" },
      ],
    },
    {
      id: "case-ecommerce",
      eyebrow: "B2B E-commerce",
      title: "3x more qualified demos from the public website.",
      intro: "A B2B e-commerce deployed the Talkaris assistant on their public website to qualify visitors and guide them to the right demo based on their buying profile.",
      layout: "two-up",
      cards: [
        { eyebrow: "Problem", title: "High bounce rate without clear conversion", body: "Visitors arrived with questions but did not find quick answers and left." },
        { eyebrow: "Result", title: "3x more qualified demos per week", body: "The assistant filters purchase intent and offers contextualized CTAs to the visitor profile.", metric: "3× pipeline" },
      ],
    },
    {
      id: "case-internal",
      eyebrow: "Internal portal",
      title: "Company knowledge indexed in 2 hours.",
      intro: "A 50-person team needed to access technical documentation and internal processes without relying on manual searches or interrupting experts.",
      layout: "two-up",
      cards: [
        { eyebrow: "Problem", title: "Documentation scattered across Notion, PDFs and shared folders", body: "The knowledge existed but nobody found it. Questions were always answered by the same experts." },
        { eyebrow: "Result", title: "Unified knowledge base with instant answers", body: "Ingestion of Notion, PDF and internal sitemap sources in an afternoon. The assistant responds in under 2 seconds.", metric: "2h → production" },
      ],
    },
    {
      id: "industries",
      eyebrow: "Industries",
      title: "Talkaris works wherever there is knowledge and conversation.",
      intro: "There is no exclusive sector. There are usage patterns that repeat across different industries.",
      layout: "three-up",
      cards: [
        { eyebrow: "SaaS", title: "Onboarding and support in product", body: "Reduce configuration tickets and improve adoption with contextual assistance in the user flow." },
        { eyebrow: "B2B E-commerce", title: "Lead capture and qualification on web", body: "Convert visits with intent into qualified conversations and demos oriented to the buyer's profile." },
        { eyebrow: "Consulting", title: "Client portals and documentation", body: "Centralize project and process knowledge in a frictionless assistant for the team." },
        { eyebrow: "EdTech", title: "Learning support", body: "Answer content questions, navigate the catalog and support the student without depending on the tutor." },
        { eyebrow: "Healthcare", title: "Information and referral", body: "Provide structured information, filter queries and refer to a professional when necessary with full traceability." },
        { eyebrow: "Legal and compliance", title: "Access to internal regulations", body: "The team queries policies, procedures and regulations without interrupting the legal department." },
      ],
    },
  ],
  timelineTitle: "The process to go live this week.",
  timelineIntro: "No eternal projects or complex integrations.",
  timeline: [
    { step: "01", title: "Demo tailored to your case", body: "We review which surface to activate, what knowledge you have available and what result you want to measure." },
    { step: "02", title: "Configuration and snippet in 1 day", body: "Widget, knowledge base and conversational policy configured. One snippet to integrate it in your web or product." },
    { step: "03", title: "Operations and continuous improvement", body: "Conversations, leads and analytics from the console. Knowledge improvements without touching code." },
  ],
  faqs: [
    { question: "Are the use cases real?", answer: "They are cases based on real deployment patterns, represented with fictitious names to respect customer confidentiality." },
    { question: "Can I see a demo with my specific use case?", answer: "Yes. The Talkaris demo is tailored to your surface and real goal, not a generic presentation." },
    { question: "How long does a real deployment take?", answer: "Between 1 and 5 days depending on the complexity of the knowledge and the surface. The widget on a website can be activated in hours." },
  ],
  ctaPanel: {
    eyebrow: "Is your company next?",
    title: "Want to be the next success story?",
    body: "Request the demo and in 30 minutes we evaluate whether Talkaris is the right fit for your web, product or portal.",
    primaryLabel: "Request demo",
    primaryPath: "/en/request-demo",
    secondaryLabel: "See pricing",
    secondaryPath: "/en/pricing",
  },
};

export const PUBLIC_PAGES: PublicPageDefinition[] = [
  HOME_ES,
  FEATURES_ES,
  INTEGRATIONS_ES,
  USE_CASES_ES,
  FAQ_ES,
  BLOG_ES,
  PRICING_ES,
  CUSTOMERS_ES,
  HOME_EN,
  FEATURES_EN,
  INTEGRATIONS_EN,
  USE_CASES_EN,
  FAQ_EN,
  BLOG_EN,
  PRICING_EN,
  CUSTOMERS_EN,
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
