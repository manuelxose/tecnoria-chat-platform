import { IDataSourceProvider, IngestedDocument } from "@tecnoria-chat/application";

export class NotionProvider implements IDataSourceProvider {
  public canHandle(url: string): boolean {
    return url.includes("notion.site") || url.includes("notion.so");
  }

  public async fetch(url: string, config: any): Promise<IngestedDocument> {
    const pageId = this.extractId(url);
    // Integration with Notion API SDK...
    return {
      id: pageId || "unknown",
      projectId: config.projectId,
      sourceUrl: url,
      title: "Notion Page " + pageId,
      body: "NOTION_BLOCK_CONTENT_PARSED_" + pageId,
      metadata: { type: "notion", pageId }
    };
  }

  private extractId(url: string): string | null {
    const match = url.match(/[a-f0-9]{32}/);
    return match ? match[0] : null;
  }
}
