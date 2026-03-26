export interface IngestedDocument {
  id: string;
  projectId: string;
  sourceUrl: string;
  title: string;
  body: string;
  metadata: Record<string, any>;
}

export interface IDataSourceProvider {
  canHandle(url: string): boolean;
  fetch(url: string, config: any): Promise<IngestedDocument>;
}
