import { PortalSettings } from "../core/models";
import { DEFAULT_PORTAL_SETTINGS, getAlternatePublicPage, PublicPageDefinition } from "../content/public-site";

export interface SeoLink {
  rel: "canonical" | "alternate";
  href: string;
  hreflang?: string;
}

export interface SeoPayload {
  pageTitle: string;
  description: string;
  robots: string;
  canonicalUrl: string;
  locale: string;
  keywords: string;
  links: SeoLink[];
  schemas: Record<string, unknown>[];
  ogImageUrl: string;
  siteName: string;
}

export interface DynamicSitemapEntry {
  path: string;
  locale: "es" | "en";
  updatedAt?: string | null;
}

export function ensureBaseUrl(baseUrl?: string): string {
  const fallback = DEFAULT_PORTAL_SETTINGS.portalBaseUrl;
  const normalized = (baseUrl || fallback).replace(/\/$/, "");
  return normalized || fallback;
}

export function joinUrl(baseUrl: string, path: string): string {
  return `${ensureBaseUrl(baseUrl)}${path === "/" ? "" : path}`;
}

export function buildPageSeo(
  page: PublicPageDefinition,
  settings: PortalSettings = DEFAULT_PORTAL_SETTINGS,
  baseUrl = settings.portalBaseUrl
): SeoPayload {
  const safeSettings = { ...DEFAULT_PORTAL_SETTINGS, ...settings };
  const canonicalUrl = joinUrl(baseUrl, page.path);
  const pageTitle = page.seoTitle || `${page.title} | ${safeSettings.brandName}`;
  const links: SeoLink[] = [
    { rel: "canonical", href: canonicalUrl },
    {
      rel: "alternate",
      href: joinUrl(baseUrl, getAlternatePublicPage(page, "es").path),
      hreflang: "es",
    },
    {
      rel: "alternate",
      href: joinUrl(baseUrl, getAlternatePublicPage(page, "en").path),
      hreflang: "en",
    },
    {
      rel: "alternate",
      href: joinUrl(baseUrl, getAlternatePublicPage(page, "es").path),
      hreflang: "x-default",
    },
  ];

  return {
    pageTitle,
    description: page.seoDescription || page.description,
    robots: page.indexable ? "index, follow" : "noindex, follow",
    canonicalUrl,
    locale: page.locale === "es" ? "es_ES" : "en_US",
    keywords: [...page.seoKeywords, ...safeSettings.seoKeywords].join(", "),
    links,
    schemas: buildPageSchemas(page, safeSettings, canonicalUrl),
    ogImageUrl: safeSettings.seoImageUrl,
    siteName: safeSettings.organizationName || safeSettings.brandName,
  };
}

export function buildNoIndexSeo(
  title: string,
  description: string,
  path: string,
  locale: "es" | "en",
  settings: PortalSettings = DEFAULT_PORTAL_SETTINGS,
  baseUrl = settings.portalBaseUrl
): SeoPayload {
  const safeSettings = { ...DEFAULT_PORTAL_SETTINGS, ...settings };
  const canonicalUrl = joinUrl(baseUrl, path);
  return {
    pageTitle: `${title} | ${safeSettings.brandName}`,
    description,
    robots: "noindex, follow",
    canonicalUrl,
    locale: locale === "es" ? "es_ES" : "en_US",
    keywords: safeSettings.seoKeywords.join(", "),
    links: [{ rel: "canonical", href: canonicalUrl }],
    schemas: [buildWebPageSchema("WebPage", title, description, canonicalUrl, locale)],
    ogImageUrl: safeSettings.seoImageUrl,
    siteName: safeSettings.organizationName || safeSettings.brandName,
  };
}

export function buildBlogArticleSeo(
  article: {
    title: string;
    description: string;
    path: string;
    locale: "es" | "en";
    imageUrl?: string | null;
    author?: string | null;
    publishedAt?: string | null;
  },
  settings: PortalSettings = DEFAULT_PORTAL_SETTINGS,
  baseUrl = settings.portalBaseUrl
): SeoPayload {
  const safeSettings = { ...DEFAULT_PORTAL_SETTINGS, ...settings };
  const canonicalUrl = joinUrl(baseUrl, article.path);
  const pageTitle = `${article.title} | ${safeSettings.brandName}`;
  const imageUrl = article.imageUrl || safeSettings.seoImageUrl;

  return {
    pageTitle,
    description: article.description,
    robots: "index, follow",
    canonicalUrl,
    locale: article.locale === "es" ? "es_ES" : "en_US",
    keywords: [article.title, "blog", safeSettings.brandName, ...safeSettings.seoKeywords].join(", "),
    links: [{ rel: "canonical", href: canonicalUrl }],
    schemas: [
      buildOrganizationSchema(safeSettings),
      buildWebSiteSchema(safeSettings),
      buildBreadcrumbSchema(
        article.locale === "es"
          ? [
              { name: "Inicio", url: joinUrl(baseUrl, "/") },
              { name: "Blog", url: joinUrl(baseUrl, "/blog") },
              { name: article.title, url: canonicalUrl },
            ]
          : [
              { name: "Home", url: joinUrl(baseUrl, "/en") },
              { name: "Blog", url: joinUrl(baseUrl, "/en/blog") },
              { name: article.title, url: canonicalUrl },
            ]
      ),
      {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: article.title,
        description: article.description,
        url: canonicalUrl,
        inLanguage: article.locale,
        image: imageUrl,
        datePublished: article.publishedAt ?? undefined,
        dateModified: article.publishedAt ?? undefined,
        author: {
          "@type": "Person",
          name: article.author || safeSettings.brandName,
        },
        publisher: {
          "@type": "Organization",
          name: safeSettings.organizationName || safeSettings.brandName,
          url: safeSettings.portalBaseUrl,
        },
      },
    ],
    ogImageUrl: imageUrl,
    siteName: safeSettings.organizationName || safeSettings.brandName,
  };
}

function buildPageSchemas(
  page: PublicPageDefinition,
  settings: PortalSettings,
  canonicalUrl: string
): Record<string, unknown>[] {
  const pageType = page.key === "blog" ? "CollectionPage" : "WebPage";
  const schemas: Record<string, unknown>[] = [
    buildOrganizationSchema(settings),
    buildWebSiteSchema(settings),
    buildWebPageSchema(pageType, page.title, page.seoDescription || page.description, canonicalUrl, page.locale),
  ];

  if (page.key !== "home") {
    schemas.push(
      buildBreadcrumbSchema([
        {
          name: page.locale === "es" ? "Inicio" : "Home",
          url: joinUrl(settings.portalBaseUrl, page.locale === "es" ? "/" : "/en"),
        },
        {
          name: page.breadcrumbLabel,
          url: canonicalUrl,
        },
      ])
    );
  }

  if (page.key === "home" || page.key === "features") {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: settings.brandName,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: canonicalUrl,
      description: page.seoDescription || page.description,
      offers: {
        "@type": "Offer",
        availability: "https://schema.org/InStock",
      },
    });
  }

  if (page.key === "faq" && page.faqs?.length) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: page.faqs.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    });
  }

  return schemas;
}

function buildOrganizationSchema(settings: PortalSettings): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.organizationName || settings.brandName,
    url: settings.portalBaseUrl,
    email: settings.contactEmail || settings.supportEmail,
  };
}

function buildWebSiteSchema(settings: PortalSettings): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: settings.brandName,
    url: settings.portalBaseUrl,
    inLanguage: settings.defaultLocale,
  };
}

function buildWebPageSchema(
  type: string,
  title: string,
  description: string,
  canonicalUrl: string,
  locale: string
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": type,
    name: title,
    description,
    url: canonicalUrl,
    inLanguage: locale,
  };
}

function buildBreadcrumbSchema(items: Array<{ name: string; url: string }>): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildRobotsTxt(baseUrl: string): string {
  const normalizedBaseUrl = ensureBaseUrl(baseUrl);
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "Disallow: /widget/",
    "Disallow: /app",
    "Disallow: /admin",
    "",
    `Sitemap: ${normalizedBaseUrl}/sitemap.xml`,
  ].join("\n");
}

export function buildSitemapXml(
  baseUrl: string,
  pages: PublicPageDefinition[],
  dynamicEntries: DynamicSitemapEntry[] = []
): string {
  const normalizedBaseUrl = ensureBaseUrl(baseUrl);
  const lastmod = new Date().toISOString().slice(0, 10);
  const indexablePages = pages.filter((page) => page.indexable);
  const pageEntries = indexablePages
    .map((page) => {
      const canonical = joinUrl(normalizedBaseUrl, page.path);
      const alternateEs = joinUrl(normalizedBaseUrl, getAlternatePublicPage(page, "es").path);
      const alternateEn = joinUrl(normalizedBaseUrl, getAlternatePublicPage(page, "en").path);
      return `  <url>
    <loc>${canonical}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.key === "blog" ? "weekly" : "monthly"}</changefreq>
    <priority>${page.key === "home" ? "1.0" : page.key === "blog" ? "0.9" : "0.8"}</priority>
    <xhtml:link rel="alternate" hreflang="es" href="${alternateEs}" />
    <xhtml:link rel="alternate" hreflang="en" href="${alternateEn}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${alternateEs}" />
  </url>`;
    })
    .join("\n");

  const dynamic = dynamicEntries
    .map((entry) => {
      const canonical = joinUrl(normalizedBaseUrl, entry.path);
      const alternatePath = entry.locale === "es"
        ? entry.path.replace(/^\/blog\//, "/en/blog/")
        : entry.path.replace(/^\/en\/blog\//, "/blog/");

      return `  <url>
    <loc>${canonical}</loc>
    <lastmod>${(entry.updatedAt || lastmod).slice(0, 10)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
    <xhtml:link rel="alternate" hreflang="${entry.locale}" href="${canonical}" />
    <xhtml:link rel="alternate" hreflang="${entry.locale === "es" ? "en" : "es"}" href="${joinUrl(normalizedBaseUrl, alternatePath)}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${canonical}" />
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
>
${pageEntries}
${dynamic ? `\n${dynamic}` : ""}
</urlset>`;
}
