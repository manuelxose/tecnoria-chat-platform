import { ChatAnswer, ProjectRecord, ScoredChunk } from "./types.js";

export function scoreCommercialIntent(message: string, keywords: string[]): number {
  const lowered = message.toLowerCase();
  return keywords.reduce((score, keyword) => {
    return lowered.includes(keyword.toLowerCase()) ? score + 1 : score;
  }, 0);
}

export function selectTopChunks(chunks: ScoredChunk[], limit = 4): ScoredChunk[] {
  return [...chunks].sort((a, b) => b.score - a.score).slice(0, limit);
}

export function buildFallbackAnswer(project: ProjectRecord): ChatAnswer {
  return {
    message: project.promptPolicy.outOfScopeMessage,
    citations: [],
    cta: {
      label: project.ctaConfig.primaryLabel,
      url: project.ctaConfig.primaryUrl,
    },
    confidence: 0.15,
    usedFallback: true,
  };
}
