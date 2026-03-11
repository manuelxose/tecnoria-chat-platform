import { DOCUMENT } from "@angular/common";
import { Inject, Injectable } from "@angular/core";
import { Meta, Title } from "@angular/platform-browser";
import { SeoPayload } from "./seo-utils";

@Injectable({ providedIn: "root" })
export class SeoService {
  private jsonLdNodes: HTMLScriptElement[] = [];

  constructor(
    private readonly title: Title,
    private readonly meta: Meta,
    @Inject(DOCUMENT) private readonly document: Document
  ) {}

  update(payload: SeoPayload): void {
    this.title.setTitle(payload.pageTitle);
    this.meta.updateTag({ name: "description", content: payload.description });
    this.meta.updateTag({ name: "robots", content: payload.robots });
    this.meta.updateTag({ name: "author", content: payload.siteName });
    this.meta.updateTag({ name: "application-name", content: payload.siteName });
    this.meta.updateTag({ name: "theme-color", content: "#081220" });
    this.meta.updateTag({ property: "og:title", content: payload.pageTitle });
    this.meta.updateTag({ property: "og:description", content: payload.description });
    this.meta.updateTag({ property: "og:type", content: "website" });
    this.meta.updateTag({ property: "og:url", content: payload.canonicalUrl });
    this.meta.updateTag({ property: "og:site_name", content: payload.siteName });
    this.meta.updateTag({ property: "og:locale", content: payload.locale });
    this.meta.updateTag({ property: "og:image", content: payload.ogImageUrl });
    this.meta.updateTag({ name: "twitter:card", content: "summary_large_image" });
    this.meta.updateTag({ name: "twitter:title", content: payload.pageTitle });
    this.meta.updateTag({ name: "twitter:description", content: payload.description });
    this.meta.updateTag({ name: "twitter:image", content: payload.ogImageUrl });
    this.meta.updateTag({ name: "keywords", content: payload.keywords });

    this.syncLinks(payload);
    this.syncSchemas(payload.schemas);
  }

  private syncLinks(payload: SeoPayload): void {
    this.document
      .querySelectorAll("link[rel='canonical'], link[rel='alternate']")
      .forEach((node) => node.remove());

    for (const item of payload.links) {
      const link = this.document.createElement("link");
      link.setAttribute("rel", item.rel);
      link.setAttribute("href", item.href);
      if (item.hreflang) {
        link.setAttribute("hreflang", item.hreflang);
      }
      this.document.head.appendChild(link);
    }
  }

  private syncSchemas(schemas: Record<string, unknown>[]): void {
    this.jsonLdNodes.forEach((node) => node.remove());
    this.jsonLdNodes = schemas.map((schema) => {
      const node = this.document.createElement("script");
      node.type = "application/ld+json";
      node.text = JSON.stringify(schema);
      this.document.head.appendChild(node);
      return node;
    });
  }
}
