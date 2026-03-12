import { PortalSettings } from "../core/models";

export type PublicLocale = "es" | "en";
export type PublicPageKey = "home" | "features" | "integrations" | "use-cases" | "blog" | "faq";

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
}

export interface PublicPageSection {
  id: string;
  eyebrow: string;
  title: string;
  intro: string;
  layout: "three-up" | "two-up" | "spotlight";
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
  ],
  heroEyebrow: "Infraestructura de IA conversacional",
  heroTitle: "El stack para desplegar asistentes de IA que sí refuerzan ventas, soporte y producto.",
  heroCopy:
    "Talkaris unifica widget embebible, conocimiento controlado, analítica conversacional y operación multi-tenant para que tu equipo lance experiencias útiles, no demos vacías.",
  heroSummary:
    "Pensado para equipos B2B que necesitan claridad comercial, gobierno técnico y una capa pública capaz de convertir desde el primer scroll.",
  heroBadges: ["Widget white-label", "Base de conocimiento gobernada", "Operación multi-proyecto"],
  heroStats: [
    {
      value: "1 snippet",
      label: "Despliegue en web o producto",
      detail: "Integración asíncrona con configuración por site key y dominios permitidos.",
    },
    {
      value: "Aislado",
      label: "Conocimiento por tenant y proyecto",
      detail: "Sin mezclar contextos, documentos, conversaciones ni analítica entre clientes o aplicaciones.",
    },
    {
      value: "Centralizado",
      label: "Gobierno y visión de plataforma",
      detail: "Superadmin y consolas operativas para crecer sin perder control ni coherencia.",
    },
  ],
  heroImage: "/assets/talkaris-hero-scene.svg",
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
  heroImage: "/assets/talkaris-integration-scene.svg",
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
  heroImage: "/assets/talkaris-hero-scene.svg",
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
  heroImage: "/assets/talkaris-editorial-campaign.png",
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
  ],
  heroEyebrow: "Conversational AI infrastructure",
  heroTitle: "The stack for shipping AI assistants that strengthen sales, support and product adoption.",
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
      ...HOME_ES.sections[0],
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
      ...HOME_ES.sections[1],
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
      ...HOME_ES.sections[2],
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

export const PUBLIC_PAGES: PublicPageDefinition[] = [
  HOME_ES,
  FEATURES_ES,
  INTEGRATIONS_ES,
  USE_CASES_ES,
  FAQ_ES,
  BLOG_ES,
  HOME_EN,
  FEATURES_EN,
  INTEGRATIONS_EN,
  USE_CASES_EN,
  FAQ_EN,
  BLOG_EN,
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
