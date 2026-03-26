import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCanonicalWidgetSnippet,
  canonicalWebsiteSourceKey,
  discoverWebsiteEntry,
  extractSitemapUrlsFromRobots,
  inferAllowedDomains,
  normalizeWebsiteBaseUrl,
} from "./website-integration.js";

test("normalizeWebsiteBaseUrl strips query and hash while keeping the root", () => {
  assert.equal(normalizeWebsiteBaseUrl("https://example.com/?foo=1#hero"), "https://example.com/");
  assert.equal(normalizeWebsiteBaseUrl("https://example.com/docs/?foo=1#hero"), "https://example.com/docs");
});

test("extractSitemapUrlsFromRobots resolves sitemap declarations", () => {
  const robots = `
    User-agent: *
    Disallow:
    Sitemap: /sitemap.xml
    Sitemap: https://cdn.example.com/sitemap_index.xml
  `;

  assert.deepEqual(extractSitemapUrlsFromRobots(robots, "https://example.com/"), [
    "https://example.com/sitemap.xml",
    "https://cdn.example.com/sitemap_index.xml",
  ]);
});

test("discoverWebsiteEntry prefers sitemap declarations from robots.txt", async () => {
  const responses = new Map<string, Response>([
    [
      "https://example.com/robots.txt",
      new Response("Sitemap: https://example.com/sitemap.xml", { status: 200 }),
    ],
    [
      "https://example.com/sitemap.xml",
      new Response("<urlset></urlset>", { status: 200 }),
    ],
  ]);

  const result = await discoverWebsiteEntry("https://example.com/", async (input) => {
    const url = String(input);
    const response = responses.get(url);
    if (!response) {
      throw new Error(`Unexpected fetch: ${url}`);
    }
    return response;
  });

  assert.deepEqual(result, {
    detectedMode: "sitemap",
    entryUrl: "https://example.com/sitemap.xml",
  });
});

test("discoverWebsiteEntry falls back to html when no sitemap is available", async () => {
  const result = await discoverWebsiteEntry("https://example.com/", async (input) => {
    const url = String(input);
    if (url === "https://example.com/robots.txt") {
      return new Response("", { status: 404 });
    }
    if (url === "https://example.com/sitemap.xml" || url === "https://example.com/sitemap_index.xml") {
      return new Response("", { status: 404 });
    }
    throw new Error(`Unexpected fetch: ${url}`);
  });

  assert.deepEqual(result, {
    detectedMode: "html",
    entryUrl: "https://example.com/",
  });
});

test("canonical website integration constants stay stable", () => {
  assert.equal(canonicalWebsiteSourceKey(), "website-public");
  assert.deepEqual(inferAllowedDomains("https://docs.example.com/"), ["docs.example.com"]);
});

test("buildCanonicalWidgetSnippet only emits TalkarisWidgetConfig", () => {
  const snippet = buildCanonicalWidgetSnippet({
    siteKey: "site-key",
    apiBase: "https://talkaris.com/api",
    widgetBaseUrl: "https://talkaris.com/widget/",
    assetVersion: "20260320-widget-runtime-v8",
  });

  assert.match(snippet, /window\.TalkarisWidgetConfig/);
  assert.match(snippet, /assetVersion: "20260320-widget-runtime-v8"/);
  assert.doesNotMatch(snippet, /ChatPortalWidgetConfig/);
  assert.doesNotMatch(snippet, /TecnoriaChatWidgetConfig/);
});
