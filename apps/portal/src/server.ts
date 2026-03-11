import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from "@angular/ssr/node";
import express from "express";
import http from "node:http";
import https from "node:https";
import { join } from "node:path";
import { PUBLIC_PAGES } from "./app/content/public-site";
import { buildRobotsTxt, buildSitemapXml, ensureBaseUrl, type DynamicSitemapEntry } from "./app/services/seo-utils";

type SessionUser = {
  id: string;
  email: string;
  platformRole: "superadmin" | "member";
};

const browserDistFolder = join(import.meta.dirname, "../browser");
const angularApp = new AngularNodeAppEngine();
const app = express();
const port = Number(process.env["PORT"] ?? 4103);
const canonicalHost = process.env["CANONICAL_HOST"] ?? "talkaris.com";
const publicSiteUrl = process.env["PORTAL_PUBLIC_URL"] ?? "https://talkaris.com";

let cachedPlatformBaseUrl = "";
let cachedPlatformBaseUrlExpiresAt = 0;

function getApiInternalUrl(): URL {
  return new URL(process.env["API_INTERNAL_URL"] || "http://127.0.0.1:4101");
}

function getWidgetInternalUrl(): URL {
  return new URL(process.env["WIDGET_INTERNAL_URL"] || "http://127.0.0.1:4102");
}

async function getPlatformBaseUrl(): Promise<string> {
  const now = Date.now();
  if (cachedPlatformBaseUrl && cachedPlatformBaseUrlExpiresAt > now) {
    return cachedPlatformBaseUrl;
  }

  try {
    const response = await fetch(new URL("/v1/public/platform", getApiInternalUrl()));
    if (response.ok) {
      const body = await response.json() as { platform?: { portalBaseUrl?: string } };
      if (body.platform?.portalBaseUrl) {
        cachedPlatformBaseUrl = ensureBaseUrl(body.platform.portalBaseUrl);
        cachedPlatformBaseUrlExpiresAt = now + 60_000;
        return cachedPlatformBaseUrl;
      }
    }
  } catch (error) {
    console.warn("[portal:ssr] platform settings lookup failed", error);
  }

  cachedPlatformBaseUrl = ensureBaseUrl(publicSiteUrl);
  cachedPlatformBaseUrlExpiresAt = now + 60_000;
  return cachedPlatformBaseUrl;
}

async function getBlogSitemapEntries(): Promise<DynamicSitemapEntry[]> {
  try {
    const response = await fetch(new URL("/v1/public/blog?limit=200", getApiInternalUrl()));
    if (!response.ok) {
      return [];
    }

    const body = await response.json() as {
      items?: Array<{ slug: string; locale: "es" | "en"; updatedAt?: string | null }>;
    };
    const items = Array.isArray(body.items) ? body.items : [];
    return items.map((item) => ({
      path: item.locale === "en" ? `/en/blog/${item.slug}` : `/blog/${item.slug}`,
      locale: item.locale,
      updatedAt: item.updatedAt ?? null,
    }));
  } catch (error) {
    console.warn("[portal:ssr] blog sitemap lookup failed", error);
    return [];
  }
}

function proxyToTarget(targetBase: URL): express.RequestHandler {
  return (req, res) => {
    const targetUrl = new URL(req.originalUrl.replace(/^\/(?:api|widget)/, ""), targetBase);
    const transport = targetUrl.protocol === "https:" ? https : http;

    const upstream = transport.request(
      targetUrl,
      {
        method: req.method,
        headers: {
          ...req.headers,
          host: targetUrl.host,
          "x-forwarded-host": req.headers.host ?? "",
          "x-forwarded-proto": req.protocol,
        },
      },
      (upstreamResponse) => {
        res.status(upstreamResponse.statusCode || 502);
        Object.entries(upstreamResponse.headers).forEach(([key, value]) => {
          if (value !== undefined) {
            res.setHeader(key, value as string | string[]);
          }
        });
        upstreamResponse.pipe(res);
      }
    );

    upstream.on("error", (error) => {
      console.error("[portal:ssr] upstream proxy error", error);
      if (!res.headersSent) {
        res.status(503).json({ code: "UPSTREAM_UNAVAILABLE" });
      }
    });

    req.pipe(upstream);
  };
}

async function fetchSessionUser(cookieHeader: string): Promise<SessionUser | null> {
  try {
    const response = await fetch(new URL("/v1/auth/me", getApiInternalUrl()), {
      headers: {
        cookie: cookieHeader,
      },
    });
    if (!response.ok) {
      return null;
    }

    return (await response.json()) as SessionUser;
  } catch (error) {
    console.warn("[portal:ssr] session lookup failed", error);
    return null;
  }
}

app.set("trust proxy", 1);

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "talkaris-portal",
    timestamp: new Date().toISOString(),
  });
});

app.get("/robots.txt", async (_req, res) => {
  res.type("text/plain").send(buildRobotsTxt(await getPlatformBaseUrl()));
});

app.get("/sitemap.xml", async (_req, res) => {
  const [baseUrl, blogEntries] = await Promise.all([getPlatformBaseUrl(), getBlogSitemapEntries()]);
  res.type("application/xml").send(buildSitemapXml(baseUrl, PUBLIC_PAGES, blogEntries));
});

app.use("/api", proxyToTarget(getApiInternalUrl()));
app.use("/widget", proxyToTarget(getWidgetInternalUrl()));

app.use(
  express.static(browserDistFolder, {
    maxAge: "1y",
    index: false,
    redirect: false,
  })
);

app.use(async (req, res, next) => {
  if (req.hostname === `www.${canonicalHost}`) {
    res.redirect(301, `https://${canonicalHost}${req.originalUrl}`);
    return;
  }

  const cookieHeader = req.headers.cookie ?? "";
  const sessionUser = cookieHeader ? await fetchSessionUser(cookieHeader) : null;

  if (req.path.startsWith("/app") && !sessionUser) {
    res.redirect(302, "/login");
    return;
  }

  if (req.path.startsWith("/admin")) {
    if (!sessionUser) {
      res.redirect(302, "/login");
      return;
    }
    if (sessionUser.platformRole !== "superadmin") {
      res.redirect(302, "/app");
      return;
    }
  }

  if ((req.path === "/login" || req.path === "/reset-password") && sessionUser) {
    res.redirect(302, sessionUser.platformRole === "superadmin" ? "/admin" : "/app");
    return;
  }

  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

if (isMainModule(import.meta.url) || process.env["pm_id"]) {
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`portal listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
