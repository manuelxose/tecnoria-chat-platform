import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_PORTAL_SETTINGS, getPublicPage } from "../content/public-site";
import { buildPageSeo, buildRobotsTxt, buildSitemapXml } from "./seo-utils";

test("buildPageSeo emits page-specific metadata, alternates and breadcrumb schema", () => {
  const page = getPublicPage("features", "en");
  const seo = buildPageSeo(page, DEFAULT_PORTAL_SETTINGS, "https://talkaris.com");

  assert.equal(seo.canonicalUrl, "https://talkaris.com/en/features");
  assert.equal(seo.robots, "index, follow");
  assert.equal(seo.pageTitle, "Talkaris features | AI widget, knowledge, analytics and governance");
  assert.equal(seo.links.filter((item) => item.rel === "alternate").length, 3);
  assert.match(seo.keywords, /embedded ai widget/i);
  assert.ok(seo.schemas.some((schema) => schema["@type"] === "BreadcrumbList"));
});

test("buildRobotsTxt points to talkaris sitemap and blocks private paths", () => {
  const robots = buildRobotsTxt("https://talkaris.com");

  assert.match(robots, /Disallow: \/api\//);
  assert.match(robots, /Disallow: \/app/);
  assert.match(robots, /Sitemap: https:\/\/talkaris\.com\/sitemap\.xml/);
});

test("buildSitemapXml includes ES and EN alternates for indexable public pages", () => {
  const xml = buildSitemapXml("https://talkaris.com", [
    getPublicPage("home", "es"),
    getPublicPage("home", "en"),
    getPublicPage("faq", "es"),
    getPublicPage("faq", "en"),
    getPublicPage("blog", "es"),
    getPublicPage("blog", "en"),
  ]);

  assert.match(xml, /https:\/\/talkaris\.com\/en/);
  assert.match(xml, /https:\/\/talkaris\.com\/blog/);
  assert.match(xml, /hreflang="es"/);
  assert.match(xml, /hreflang="en"/);
  assert.match(xml, /x-default/);
});
