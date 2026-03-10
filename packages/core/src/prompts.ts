import { ProjectRecord, ScoredChunk } from "./types.js";

export function buildGroundedPrompt(
  project: ProjectRecord,
  userMessage: string,
  chunks: ScoredChunk[]
): string {
  const context = chunks
    .map((chunk, index) => {
      return `[${index + 1}] ${chunk.title} ${chunk.heading ?? ""}\n${chunk.body}`;
    })
    .join("\n\n");

  return [
    `Eres ${project.botName}, asistente de ${project.name}.`,
    `Tono: ${project.promptPolicy.tone}.`,
    "Responde solo con informacion respaldada por el contexto.",
    "No inventes precios, plazos no confirmados ni servicios inexistentes.",
    "Si el contexto no basta, reconoce el limite y orienta a contacto.",
    "",
    "Contexto autorizado:",
    context,
    "",
    `Pregunta: ${userMessage}`,
  ].join("\n");
}
