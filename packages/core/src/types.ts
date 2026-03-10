export type SourceKind = "sitemap" | "html" | "pdf" | "markdown";
export type Visibility = "public" | "private";
export type IngestionStatus = "queued" | "running" | "done" | "failed";
export type ConversationRole = "user" | "assistant" | "system";
export type AnalyticsEventType =
  | "widget_opened"
  | "message_sent"
  | "response_served"
  | "citation_clicked"
  | "cta_clicked"
  | "lead_submitted"
  | "no_answer"
  | "fallback";

export interface ProjectRecord {
  id: string;
  projectKey: string;
  name: string;
  siteKey: string;
  language: string;
  allowedDomains: string[];
  botName: string;
  welcomeMessage: string;
  promptPolicy: PromptPolicy;
  ctaConfig: CTAConfig;
  widgetTheme: WidgetTheme;
  leadSink: LeadSinkConfig;
}

export interface PromptPolicy {
  tone: string;
  outOfScopeMessage: string;
  guardrails: string[];
  disallowPricing: boolean;
}

export interface CTAConfig {
  primaryLabel: string;
  primaryUrl: string;
  secondaryLabel?: string;
  secondaryUrl?: string;
  salesKeywords: string[];
}

export interface WidgetTheme {
  accentColor: string;
  surfaceColor: string;
  textColor: string;
  launcherLabel: string;
}

export interface LeadSinkConfig {
  mode: "webhook";
  webhookUrl: string;
  secretHeaderName: string;
}

export interface SourceRecord {
  id: string;
  projectId: string;
  sourceKey: string;
  kind: SourceKind;
  entryUrl: string;
  includePatterns: string[];
  excludePatterns: string[];
  allowedDomains: string[];
  visibility: Visibility;
  defaultCategory?: string;
}

export interface DiscoveredUrl {
  url: string;
  priority?: number;
  lastModified?: string;
}

export interface ExtractedDocument {
  canonicalUrl: string;
  title: string;
  h1?: string;
  language: string;
  text: string;
  docType: string;
  sectionPath: string[];
  metadata: Record<string, string>;
  rawChecksum: string;
  etag?: string;
  lastModified?: string;
}

export interface ChunkRecordInput {
  heading?: string;
  body: string;
  sectionPath: string[];
  orderIndex: number;
}

export interface ScoredChunk {
  chunkId: string;
  documentId: string;
  score: number;
  heading: string | null;
  body: string;
  canonicalUrl: string;
  title: string;
  category: string | null;
}

export interface Citation {
  title: string;
  url: string;
  snippet: string;
}

export interface ChatAnswer {
  message: string;
  citations: Citation[];
  cta?: {
    label: string;
    url: string;
  };
  confidence: number;
  usedFallback: boolean;
}

export interface WidgetSessionContext {
  conversationId: string;
  projectId: string;
  siteKey: string;
}
