import { IDataSourceProvider, IngestedDocument } from "@tecnoria-chat/application";

export class YouTubeProvider implements IDataSourceProvider {
  public canHandle(url: string): boolean {
    return url.includes("youtube.com") || url.includes("youtu.be");
  }

  public async fetch(url: string, config: any): Promise<IngestedDocument> {
    const videoId = this.extractId(url);
    // Logic extracted from ingest-worker: transcripts fetching...
    return {
      id: videoId || "unknown",
      projectId: config.projectId,
      sourceUrl: url,
      title: "YouTube Video " + videoId, // Simplification for skeleton
      body: "TRANSCRIPT_FROM_VIDEO_" + videoId,
      metadata: { type: "youtube", videoId }
    };
  }

  private extractId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }
}
