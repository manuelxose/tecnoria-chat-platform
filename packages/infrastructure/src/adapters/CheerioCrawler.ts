import * as cheerio from "cheerio";
import { IngestedDocument } from "@tecnoria-chat/application";

export interface ICrawlerResult {
  links: string[];
  metadata: {
    title: string;
    description: string;
    language: string;
  };
  brandSignals: {
    siteName: string;
    logoUrl: string | null;
    faviconUrl: string | null;
    dominantColors: string[];
    language: string;
    copyHints: string[];
  };
}

export class CheerioCrawler {
  public async crawl(url: string): Promise<ICrawlerResult> {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const baseUrl = new URL(url).origin;
    const links = new Set<string>();

    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (href) {
        try {
          const absoluteUrl = new URL(href, baseUrl);
          if (absoluteUrl.origin === baseUrl) {
            links.add(absoluteUrl.href);
          }
        } catch { /* ignore invalid URLs */ }
      }
    });

    const title = $("title").text().trim();
    const description = $('meta[name="description"]').attr("content")?.trim() || "";
    const language = $("html").attr("lang") || "en";
    const themeColors = [
      $('meta[name="theme-color"]').attr("content"),
      $('meta[name="msapplication-TileColor"]').attr("content"),
      $('meta[property="og:site_name"]').attr("content"),
    ];
    const extractedColors = Array.from(
      new Set(
        [
          ...themeColors,
          ...html.match(/#[0-9a-fA-F]{6}\b/g) ?? [],
        ]
          .filter((value): value is string => typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value.trim()))
          .map((value) => value.trim().toLowerCase())
      )
    ).slice(0, 4);
    const siteName =
      $('meta[property="og:site_name"]').attr("content")?.trim()
      || $("meta[name='application-name']").attr("content")?.trim()
      || title
      || new URL(url).hostname.replace(/^www\./, "");
    const faviconHref =
      $("link[rel='icon']").attr("href")
      || $("link[rel='shortcut icon']").attr("href")
      || $("link[rel='apple-touch-icon']").attr("href")
      || null;
    const logoHref =
      $("meta[property='og:image']").attr("content")
      || $("img[alt*='logo' i]").first().attr("src")
      || $("img[src*='logo' i]").first().attr("src")
      || null;
    const copyHints = Array.from(
      new Set(
        [
          $("h1").first().text().trim(),
          $("h2").first().text().trim(),
          description,
        ].filter((value) => value.length >= 12)
      )
    ).slice(0, 3);

    return {
      links: Array.from(links),
      metadata: {
        title,
        description,
        language,
      },
      brandSignals: {
        siteName,
        logoUrl: logoHref ? new URL(logoHref, baseUrl).toString() : null,
        faviconUrl: faviconHref ? new URL(faviconHref, baseUrl).toString() : null,
        dominantColors: extractedColors,
        language,
        copyHints,
      },
    };
  }
}
