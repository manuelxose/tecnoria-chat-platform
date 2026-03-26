import { Project } from "@tecnoria-chat/domain";

export interface IAIProvider {
  ask(prompt: string, context: string): Promise<string>;
}

export interface ISearchService {
  findRelevantChunks(query: string, projectId: string): Promise<any[]>;
}

export interface ProcessMessageRequest {
  conversationId: string;
  projectId: string;
  message: string;
}

export interface ProcessMessageResponse {
  answer: string;
  citations: any[];
}

export class ProcessMessageUseCase {
  constructor(
    private projectRepository: any,
    private searchService: ISearchService,
    private aiProvider: IAIProvider
  ) {}

  public async execute(request: ProcessMessageRequest): Promise<any> {
    const project = await this.projectRepository.findById(request.projectId);
    if (!project) throw new Error("PROJECT_NOT_FOUND");

    // 1. RAG Search
    const chunks = await this.searchService.findRelevantChunks(request.message, project.id);
    const context = chunks.map(c => c.body).join("\n\n");

    // 2. AI Responding
    const answer = await this.aiProvider.ask(request.message, context);

    return { answer, chunks };
  }
}
