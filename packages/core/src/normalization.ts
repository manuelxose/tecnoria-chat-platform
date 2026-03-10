export function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, " ").replace(/\u00a0/g, " ").trim();
}

export function stripUnsafeControlChars(input: string): string {
  return input.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
}

export function sanitizePromptInjectionMarkers(input: string): string {
  return input
    .replace(/ignore previous instructions/gi, "")
    .replace(/system prompt/gi, "")
    .replace(/developer message/gi, "");
}

export function normalizeDocumentText(input: string): string {
  return normalizeWhitespace(stripUnsafeControlChars(sanitizePromptInjectionMarkers(input)));
}

export function inferLanguage(input: string, fallback = "es"): string {
  const asciiRatio = input.replace(/[^\x00-\x7F]/g, "").length / Math.max(input.length, 1);
  return asciiRatio > 0.95 ? "en" : fallback;
}
