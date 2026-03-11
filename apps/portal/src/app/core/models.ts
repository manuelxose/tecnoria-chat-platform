export type TenantRole = "admin" | "editor" | "viewer";
export type PlatformRole = "superadmin" | "member";

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
  };
  ctaConfig: {
    primaryLabel: string;
    primaryUrl: string;
    secondaryLabel?: string;
    secondaryUrl?: string;
    salesKeywords: string[];
  };
  widgetTheme: {
    accentColor: string;
    surfaceColor: string;
    textColor: string;
    launcherLabel: string;
  };
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
