import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_PORTAL_SETTINGS, getPublicPage } from "../content/public-site";
import { buildPageSeo, buildRobotsTxt, buildSitemapXml } from "./seo-utils";

test("buildPageSeo emits canonical and alternates for indexed pages", () => {
  const page = getPublicPage("features", "en");
  const seo = buildPageSeo(page, DEFAULT_PORTAL_SETTINGS, "https://talkaris.com");

  assert.equal(seo.canonicalUrl, "https://talkaris.com/en/features");
  assert.equal(seo.robots, "index, follow");
  assert.match(seo.pageTitle, /Talkaris/);
  assert.equal(seo.links.filter((item) => item.rel === "alternate").length, 3);
});

test("buildRobotsTxt points to talkaris sitemap and blocks private paths", () => {
  const robots = buildRobotsTxt("https://talkaris.com");

  assert.match(robots, /Disallow: \/api\//);
  assert.match(robots, /Disallow: \/app/);
  assert.match(robots, /Sitemap: https:\/\/talkaris\.com\/sitemap\.xml/);
});

test("buildSitemapXml includes ES and EN alternates", () => {
  const xml = buildSitemapXml("https://talkaris.com", [
    getPublicPage("home", "es"),
    getPublicPage("home", "en"),
    getPublicPage("faq", "es"),
    getPublicPage("faq", "en"),
  ]);

  assert.match(xml, /https:\/\/talkaris\.com\/en/);
  assert.match(xml, /hreflang="es"/);
  assert.match(xml, /hreflang="en"/);
  assert.match(xml, /x-default/);
});
