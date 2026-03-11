export type SourceKind = "sitemap" | "html" | "pdf" | "markdown";
export type Visibility = "public" | "private";
export type IngestionStatus = "queued" | "running" | "done" | "failed";
export type ConversationRole = "user" | "assistant" | "system";
export type TenantRole = "admin" | "editor" | "viewer";
export type PlatformRole = "superadmin" | "member";
export type UserStatus = "pending" | "active" | "disabled";
export type TenantStatus = "active" | "pending" | "disabled";
export type ProjectStatus = "active" | "draft" | "disabled";
export type AccessRequestStatus = "pending" | "reviewed" | "accepted" | "rejected";
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
  tenantId?: string;
  projectKey: string;
  name: string;
  siteKey: string;
  status?: ProjectStatus;
  publicBaseUrl?: string | null;
  metadata?: Record<string, unknown>;
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

export interface TenantRecord {
  id: string;
  slug: string;
  name: string;
  status: TenantStatus;
  brandName?: string | null;
  publicBaseUrl?: string | null;
  metadata: Record<string, unknown>;
}

export interface ChatUser {
  id: string;
  email: string;
  displayName?: string | null;
  platformRole: PlatformRole;
  status: UserStatus;
  memberships: TenantMembership[];
}

export interface TenantMembership {
  id: string;
  tenantId: string;
  userId: string;
  role: TenantRole;
  tenantName?: string;
  tenantSlug?: string;
}

export interface AccessRequest {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  requestedTenantName: string;
  status: AccessRequestStatus;
  reviewNotes?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  createdAt: string;
}

export interface PlatformSettings {
  id: string;
  brandName: string;
  legalName: string;
  tagline: string;
  summary: string;
  supportEmail: string;
  websiteUrl: string;
  productDomain: string;
  portalBaseUrl: string;
  apiBaseUrl: string;
  widgetBaseUrl: string;
  developedBy: string;
  demoProjectKey: string;
  demoSiteKey: string;
  defaultLocale: string;
  supportedLocales: string[];
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  seoImageUrl: string;
  organizationName: string;
  contactEmail: string;
  heroPoints: string[];
  featureFlags: Record<string, boolean>;
}

export interface ProjectSummary {
  id: string;
  tenantId: string;
  projectKey: string;
  name: string;
  siteKey: string;
  status: ProjectStatus;
  publicBaseUrl?: string | null;
  metadata?: Record<string, unknown>;
  allowedDomains: string[];
  botName: string;
  welcomeMessage: string;
  widgetTheme: WidgetTheme;
  ctaConfig: CTAConfig;
}

export interface LeadSummary {
  id: string;
  projectId: string;
  conversationId?: string | null;
  deliveryStatus: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  projectId: string;
  origin?: string | null;
  userAgent?: string | null;
  createdAt: string;
  messageCount: number;
  lastMessageAt?: string | null;
}
