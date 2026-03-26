const DEFAULT_DISCOVERY_TIMEOUT_MS = 8_000;
const CANONICAL_SOURCE_KEY = "website-public";

export type WebsiteDiscoveryMode = "sitemap" | "html";

export type WebsiteDiscoveryResult = {
  detectedMode: WebsiteDiscoveryMode;
  entryUrl: string;
};

type FetchLike = typeof fetch;

export function canonicalWebsiteSourceKey(): string {
  return CANONICAL_SOURCE_KEY;
}

export function normalizeWebsiteBaseUrl(input: string): string {
  const url = new URL(input);
  if (!/^https?:$/i.test(url.protocol)) {
    throw new Error("Only http(s) website URLs are supported.");
  }
  url.hash = "";
  url.search = "";
  if (!url.pathname || url.pathname === "/") {
    url.pathname = "/";
    return url.toString();
  }
  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  return url.toString();
}

export function inferAllowedDomains(baseUrl: string): string[] {
  return [new URL(baseUrl).hostname];
}

export function extractSitemapUrlsFromRobots(robotsBody: string, baseUrl: string): string[] {
  const base = new URL(baseUrl);
  const discovered = robotsBody
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^sitemap:/i.test(line))
    .map((line) => line.replace(/^sitemap:/i, "").trim())
    .filter(Boolean)
    .map((candidate) => {
      try {
        return new URL(candidate, base).toString();
      } catch {
        return null;
      }
    })
    .filter((candidate): candidate is string => Boolean(candidate));

  return [...new Set(discovered)];
}

export async function discoverWebsiteEntry(
  baseUrl: string,
  fetchImpl: FetchLike = fetch
): Promise<WebsiteDiscoveryResult> {
  const normalizedBase = normalizeWebsiteBaseUrl(baseUrl);
  const robotsUrl = new URL("/robots.txt", normalizedBase).toString();
  const robotsBody = await safeFetchText(robotsUrl, fetchImpl);
  const robotCandidates = robotsBody ? extractSitemapUrlsFromRobots(robotsBody, normalizedBase) : [];
  for (const candidate of robotCandidates) {
    if (await urlExists(candidate, fetchImpl)) {
      return { detectedMode: "sitemap", entryUrl: candidate };
    }
  }

  const directCandidates = [
    new URL("/sitemap.xml", normalizedBase).toString(),
    new URL("/sitemap_index.xml", normalizedBase).toString(),
  ];
  for (const candidate of directCandidates) {
    if (await urlExists(candidate, fetchImpl)) {
      return { detectedMode: "sitemap", entryUrl: candidate };
    }
  }

  return {
    detectedMode: "html",
    entryUrl: normalizedBase,
  };
}

export function buildCanonicalWidgetSnippet(config: {
  siteKey: string;
  apiBase: string;
  widgetBaseUrl: string;
  assetVersion?: string | null;
}): string {
  const widgetBaseUrl = ensureTrailingSlash(config.widgetBaseUrl);
  const lines = [
    "<script>",
    "  window.TalkarisWidgetConfig = {",
    `    siteKey: "${escapeForDoubleQuotedJs(config.siteKey)}",`,
    `    apiBase: "${escapeForDoubleQuotedJs(config.apiBase)}",`,
    `    widgetBaseUrl: "${escapeForDoubleQuotedJs(widgetBaseUrl)}"${config.assetVersion ? "," : ""}`,
  ];
  if (config.assetVersion) {
    lines.push(`    assetVersion: "${escapeForDoubleQuotedJs(config.assetVersion)}"`);
  }
  lines.push("  };");
  lines.push("</script>");
  lines.push(`<script async src="${new URL("embed.js", widgetBaseUrl).toString()}"></script>`);
  return lines.join("\n");
}

async function safeFetchText(url: string, fetchImpl: FetchLike): Promise<string | null> {
  try {
    const response = await fetchWithTimeout(url, fetchImpl);
    if (!response.ok) {
      return null;
    }
    return await response.text();
  } catch {
    return null;
  }
}

async function urlExists(url: string, fetchImpl: FetchLike): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(url, fetchImpl);
    return response.ok;
  } catch {
    return false;
  }
}

async function fetchWithTimeout(url: string, fetchImpl: FetchLike): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_DISCOVERY_TIMEOUT_MS);
  try {
    return await fetchImpl(url, {
      headers: {
        "user-agent": "TalkarisWebsiteDiscovery/1.0 (+https://talkaris.com)",
      },
      redirect: "follow",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function escapeForDoubleQuotedJs(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
