import { IDataSourceProvider, IngestedDocument } from "../ports/IDataSourceProvider.js";

// Service for indexing vectors
export interface IVectorRepository {
  upsert(doc: IngestedDocument): Promise<void>;
}

export class IngestDocumentUseCase {
  constructor(
    private providers: IDataSourceProvider[],
    private vectorRepo: IVectorRepository
  ) {}

  public async execute(url: string, projectId: string): Promise<void> {
    const provider = this.providers.find((p) => p.canHandle(url));
    if (!provider) throw new Error("UNSUPPORTED_DATA_SOURCE: " + url);

    const doc = await provider.fetch(url, { projectId });
    await this.vectorRepo.upsert(doc);
  }
}
