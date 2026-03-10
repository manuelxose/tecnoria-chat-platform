import { ChunkRecordInput } from "./types.js";
import { normalizeDocumentText } from "./normalization.js";

export interface ChunkingOptions {
  targetSize?: number;
  overlap?: number;
}

export function splitIntoSemanticChunks(
  text: string,
  sectionPath: string[],
  options: ChunkingOptions = {}
): ChunkRecordInput[] {
  const normalized = normalizeDocumentText(text);
  if (!normalized) {
    return [];
  }

  const targetSize = options.targetSize ?? 750;
  const overlap = options.overlap ?? 120;
  const paragraphs = normalized
    .split(/\n{2,}|(?<=\.)\s+(?=[A-ZÁÉÍÓÚÑ0-9])/)
    .map((part) => part.trim())
    .filter(Boolean);

  const chunks: ChunkRecordInput[] = [];
  let buffer = "";
  let orderIndex = 0;

  for (const paragraph of paragraphs) {
    const next = buffer ? `${buffer} ${paragraph}` : paragraph;
    if (next.length <= targetSize) {
      buffer = next;
      continue;
    }

    if (buffer) {
      chunks.push({
        heading: sectionPath.at(-1),
        body: buffer,
        sectionPath,
        orderIndex: orderIndex++,
      });
    }

    buffer = paragraph.length > targetSize ? paragraph.slice(0, targetSize) : paragraph;
  }

  if (buffer) {
    chunks.push({
      heading: sectionPath.at(-1),
      body: buffer,
      sectionPath,
      orderIndex,
    });
  }

  if (chunks.length <= 1 || overlap <= 0) {
    return chunks;
  }

  return chunks.map((chunk, index) => {
    if (index === 0) {
      return chunk;
    }

    const previousTail = chunks[index - 1].body.slice(-overlap);
    return {
      ...chunk,
      body: `${previousTail} ${chunk.body}`.trim(),
    };
  });
}
