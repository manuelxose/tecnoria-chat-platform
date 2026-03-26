export type TenantRole = "admin" | "editor" | "viewer";
export type PlatformRole = "superadmin" | "member";
export type WidgetPresetKey = "indigo" | "violet" | "midnight" | "aurora";
export type WidgetLauncherShape = "pill" | "rounded" | "compact";
export type WidgetButtonStyle = "solid" | "glass" | "outline";

export interface AssistantProfile {
  positioningStatement: string;
  serviceCatalog: string[];
  qualificationGoals: string[];
  nextStepRules: string[];
  servicePromptLibrary: string[];
}

export interface RuntimePolicy {
  posture: string;
  scope: string;
  roadmapDepth: string;
  maxMobileSuggestions: number;
  maxDesktopSuggestions: number;
  commercialIntentThreshold: number;
  hideStartersAfterFirstUserMessage: boolean;
}

export interface WebsiteIntegrationResult {
  detectedMode: "sitemap" | "html";
  sourceKey: string;
  entryUrl: string;
  allowedDomains: string[];
  ingestionJobId: string;
  snippet: string;
}

export interface WidgetSuggestionItem {
  label: string;
  prompt: string;
  kind: "service" | "qualification" | "follow_up" | "contact";
}

export interface WidgetSuggestionBlock {
  slot: "follow_up" | "services" | "qualification";
  items: WidgetSuggestionItem[];
}

export interface PortalSettings {
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

export interface DemoConfig {
  projectKey: string;
  siteKey: string;
  botName?: string;
  welcomeMessage?: string;
}

export interface PlatformPublicResponse {
  platform: PortalSettings;
  demo: DemoConfig;
}

export interface TenantMembership {
  id: string;
  tenantId: string;
  userId: string;
  role: TenantRole;
  tenantName?: string;
  tenantSlug?: string;
}

export interface PortalUser {
  id: string;
  email: string;
  displayName?: string | null;
  platformRole: PlatformRole;
  status: "pending" | "active" | "disabled";
  memberships: TenantMembership[];
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  status: "active" | "pending" | "disabled";
  brandName?: string | null;
  publicBaseUrl?: string | null;
  metadata: Record<string, unknown>;
}

export interface Project {
  id: string;
  tenantId?: string;
  projectKey: string;
  name: string;
  siteKey: string;
  status?: "active" | "draft" | "disabled";
  publicBaseUrl?: string | null;
  metadata?: Record<string, unknown>;
  language: string;
  allowedDomains: string[];
  botName: string;
  welcomeMessage: string;
  promptPolicy: {
    tone: string;
    outOfScopeMessage: string;
    guardrails?: string[];
    disallowPricing?: boolean;
  };
  ctaConfig: {
    primaryLabel: string;
    primaryUrl: string;
    secondaryLabel?: string;
    secondaryUrl?: string;
    salesKeywords: string[];
  };
  widgetTheme: {
    presetKey?: WidgetPresetKey;
    accentColor: string;
    surfaceColor: string;
    textColor: string;
    launcherLabel: string;
    launcherEyebrow?: string;
    launcherIcon?: string;
    launcherShape?: WidgetLauncherShape;
    buttonStyle?: WidgetButtonStyle;
    botCopy?: string;
    logoUrl?: string;
    removeBranding?: boolean;
    proactiveMessage?: string;
    proactiveDelaySeconds?: number;
    composerPlaceholder?: string;
    sendButtonLabel?: string;
  };
  enableHandover?: boolean;
  aiConfig?: AiConfig;
  languageMode?: "fixed" | "auto";
  starterQuestions?: string[];
}

export interface CrawlBrandSignals {
  siteName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  dominantColors: string[];
  language: string;
  copyHints: string[];
}

export interface CrawlResult {
  baseUrl: string;
  pages: string[];
  metadata: {
    title: string;
    description: string;
    language: string;
  };
  brandSignals: CrawlBrandSignals;
}

export interface ProjectDetail extends Project {
  aiConfig: AiConfig;
  starterQuestions: string[];
  assistantProfile?: AssistantProfile;
  runtimePolicy?: RuntimePolicy;
}

export interface SourceItem {
  id: string;
  project_id?: string;
  projectKey?: string;
  source_key?: string;
  sourceKey?: string;
  kind: string;
  entry_url?: string;
  entryUrl?: string;
  visibility: string;
  default_category?: string | null;
  defaultCategory?: string | null;
  source_config?: Record<string, unknown>;
  sourceConfig?: Record<string, unknown>;
}

export interface IngestionItem {
  id: string;
  status: string;
  requestedBy: string;
  sourceKey: string;
  projectKey: string;
  createdAt: string;
}

export interface DocumentItem {
  id: string;
  canonicalUrl: string;
  title: string;
  docType: string;
  language: string;
  category?: string | null;
  visibility: string;
  currentVersion: number;
  lastIngestedAt?: string | null;
  sourceKey: string;
  projectKey: string;
}

export interface LeadItem {
  id: string;
  projectId: string;
  conversationId?: string | null;
  deliveryStatus: string;
  payload: Record<string, unknown>;
  createdAt: string;
  projectKey?: string;
}

export interface ConversationItem {
  id: string;
  projectId: string;
  origin?: string | null;
  userAgent?: string | null;
  createdAt: string;
  messageCount: number;
  lastMessageAt?: string | null;
  projectKey: string;
  lastMessagePreview?: string | null;
  lastMessageRole?: string | null;
  channelKind?: "widget" | "telegram" | "whatsapp" | "other";
  contactLabel?: string | null;
}

export interface MessageItem {
  id: string;
  role: string;
  body: string;
  citations: Array<{ title: string; url: string; snippet: string }>;
  confidence?: number | null;
  createdAt: string;
}

export interface AccessRequest {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  requestedTenantName: string;
  status: string;
  reviewNotes?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  createdAt: string;
}

export interface AdminOverview {
  counts: {
    tenants: number;
    users: number;
    projects: number;
    pending_requests: number;
    leads: number;
    conversations: number;
  };
  recentRequests: AccessRequest[];
}

export interface BlogPostSummary {
  id: string;
  slug: string;
  locale: "es" | "en";
  title: string;
  summary: string;
  imageUrl: string | null;
  tags: string[];
  author: string;
  category: string | null;
  status: "draft" | "publish";
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  publicUrl: string;
}

export interface BlogPostDetail extends BlogPostSummary {
  bodyHtml: string;
}

// V1.5 models

export interface WorkspaceMember {
  userId: string;
  email: string;
  displayName: string | null;
  role: TenantRole;
  status: "pending" | "active" | "disabled";
  joinedAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface ApiKeyCreated extends ApiKey {
  key: string;
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  description: string | null;
  active: boolean;
  createdAt: string;
}

export interface WebhookCreated extends Webhook {
  secret: string;
}

export interface IngestionSchedule {
  id: string;
  name: string;
  sourceIds: string[];
  cronExpr: string;
  active: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
}

export interface NotificationPrefs {
  emailRecipients: string[];
  leadCreated: boolean;
  ingestionFailed: boolean;
  lowConfidenceAlert: boolean;
  lowConfidenceThreshold: number;
  digestFrequency: "none" | "daily" | "weekly";
}

export interface SatisfactionStats {
  avg: number;
  total: number;
  distribution: Record<string, number>;
  recentComments: Array<{ score: number; comment: string | null; date: string }>;
}

export interface TestChatResponse {
  message: string;
  citations: Array<{ title: string; url: string; snippet: string }>;
  confidence: number;
  usedFallback: boolean;
}

export interface HandoverEvent {
  id: string;
  status: "pending" | "assigned" | "closed";
  reason: string | null;
  createdAt: string;
}

export interface AiConfig {
  provider?: "openai" | "anthropic" | "deepseek" | "google" | "local";
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPromptAdditions?: string;
}

export interface HandoverQueueItem {
  id: string;
  status: "pending" | "assigned" | "closed";
  reason: string | null;
  createdAt: string;
  claimedBy: string | null;
  claimedAt: string | null;
  resolvedAt: string | null;
  notes: string | null;
  sessionId: string;
  projectKey: string;
  botName: string;
}

export interface RagQualityStats {
  period: string;
  totalMessages: number;
  fallbackRate: number;
  avgConfidence: number | null;
  lowConfidenceCount: number;
  coverageScore: number | null;
  topGaps: Array<{ question: string; count: number }>;
}

export interface AnalyticsTrends {
  period: string;
  resolutionRate: number | null;
  handoverRate: number | null;
  avgMessagesPerConversation: number | null;
  avgConversationDurationMinutes: number | null;
  dailySeries: Array<{
    date: string;
    messages: number;
    resolved: number;
    handovers: number;
  }>;
}

export interface ChannelItem {
  id: string;
  kind: "telegram" | "whatsapp";
  status: "active" | "paused";
  has_token: boolean;
  created_at: string;
  webhookUrl?: string | null;
  verified?: boolean;
  label?: string | null;
  phoneNumber?: string | null;
  projectKey?: string;
  lastError?: string | null;
  configSummary?: Record<string, unknown>;
}

export interface UploadedAsset {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  sourceKey?: string;
  jobId?: string;
}
