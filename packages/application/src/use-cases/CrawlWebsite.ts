export interface CrawlWebsiteRequest {
  url: string;
}

export interface CrawlWebsiteResponse {
  baseUrl: string;
  pages: string[];
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

export class CrawlWebsiteUseCase {
  constructor(private crawler: any) {}

  public async execute(request: CrawlWebsiteRequest): Promise<CrawlWebsiteResponse> {
    const result = await this.crawler.crawl(request.url);
    return {
      baseUrl: new URL(request.url).origin,
      pages: result.links,
      metadata: result.metadata,
      brandSignals: result.brandSignals,
    };
  }
}
