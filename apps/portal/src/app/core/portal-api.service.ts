import { HttpClient } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { API_BASE_URL } from "./api-base-url.token";
import {
  AccessRequest,
  AdminOverview,
  AiConfig,
  ApiKey,
  ApiKeyCreated,
  BlogPostDetail,
  BlogPostSummary,
  ConversationItem,
  DocumentItem,
  HandoverEvent,
  HandoverQueueItem,
  IngestionItem,
  IngestionSchedule,
  LeadItem,
  MessageItem,
  NotificationPrefs,
  PlatformPublicResponse,
  PortalSettings,
  PortalUser,
  Project,
  AnalyticsTrends,
  ChannelItem,
  RagQualityStats,
  SatisfactionStats,
  SourceItem,
  Tenant,
  TestChatResponse,
  Webhook,
  WebhookCreated,
  WorkspaceMember,
} from "./models";

@Injectable({ providedIn: "root" })
export class PortalApiService {
  private readonly baseUrl: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) baseUrl: string
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  private url(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  publicPlatform(): Promise<PlatformPublicResponse> {
    return firstValueFrom(this.http.get<PlatformPublicResponse>(this.url("/v1/public/platform")));
  }

  publicBlog(locale?: "es" | "en", limit = 24): Promise<{ items: BlogPostSummary[] }> {
    const query = new URLSearchParams();
    query.set("limit", String(limit));
    if (locale) {
      query.set("locale", locale);
    }

    return firstValueFrom(this.http.get<{ items: BlogPostSummary[] }>(this.url(`/v1/public/blog?${query.toString()}`)));
  }

  publicBlogPost(slug: string): Promise<BlogPostDetail> {
    return firstValueFrom(this.http.get<BlogPostDetail>(this.url(`/v1/public/blog/${encodeURIComponent(slug)}`)));
  }

  submitAccessRequest(payload: {
    name: string;
    company: string;
    email: string;
    phone?: string;
    message?: string;
    requestedTenantName?: string;
  }): Promise<unknown> {
    return firstValueFrom(this.http.post(this.url("/v1/public/access-requests"), payload));
  }

  login(email: string, password: string): Promise<PortalUser> {
    return firstValueFrom(
      this.http.post<PortalUser>(
        this.url("/v1/auth/login"),
        { email, password },
        { withCredentials: true }
      )
    );
  }

  logout(): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(this.url("/v1/auth/logout"), {}, { withCredentials: true })
    );
  }

  async me(): Promise<PortalUser | null> {
    try {
      return await firstValueFrom(
        this.http.get<PortalUser>(this.url("/v1/auth/me"), { withCredentials: true })
      );
    } catch {
      return null;
    }
  }

  requestPasswordReset(email: string): Promise<unknown> {
    return firstValueFrom(
      this.http.post(this.url("/v1/auth/password/request-reset"), { email })
    );
  }

  resetPassword(token: string, password: string): Promise<PortalUser> {
    return firstValueFrom(
      this.http.post<PortalUser>(this.url("/v1/auth/password/reset"), { token, password })
    );
  }

  listTenants(): Promise<Tenant[]> {
    return firstValueFrom(
      this.http.get<Tenant[]>(this.url("/v1/portal/tenants"), { withCredentials: true })
    );
  }

  tenantOverview(tenantId: string): Promise<{
    tenant: Tenant;
    stats: Record<string, number>;
    recentJobs: IngestionItem[];
  }> {
    return firstValueFrom(
      this.http.get<{
        tenant: Tenant;
        stats: Record<string, number>;
        recentJobs: IngestionItem[];
      }>(this.url(`/v1/portal/tenants/${tenantId}/overview`), { withCredentials: true })
    );
  }

  tenantProjects(tenantId: string): Promise<Project[]> {
    return firstValueFrom(
      this.http.get<Project[]>(this.url(`/v1/portal/tenants/${tenantId}/projects`), { withCredentials: true })
    );
  }

  upsertTenantProject(tenantId: string, payload: Record<string, unknown>): Promise<Project> {
    return firstValueFrom(
      this.http.post<Project>(this.url(`/v1/portal/tenants/${tenantId}/projects`), payload, {
        withCredentials: true,
      })
    );
  }

  projectSnippet(tenantId: string, projectKey: string): Promise<{
    siteKey: string;
    apiBase: string;
    widgetBase: string;
    snippet: string;
  }> {
    return firstValueFrom(
      this.http.get<{ siteKey: string; apiBase: string; widgetBase: string; snippet: string }>(
        this.url(`/v1/portal/tenants/${tenantId}/projects/${projectKey}/snippet`),
        { withCredentials: true }
      )
    );
  }

  tenantSources(tenantId: string, projectKey?: string): Promise<SourceItem[]> {
    const suffix = projectKey ? `?projectKey=${encodeURIComponent(projectKey)}` : "";
    return firstValueFrom(
      this.http.get<SourceItem[]>(this.url(`/v1/portal/tenants/${tenantId}/sources${suffix}`), {
        withCredentials: true,
      })
    );
  }

  upsertSource(tenantId: string, payload: Record<string, unknown>): Promise<SourceItem> {
    return firstValueFrom(
      this.http.post<SourceItem>(this.url(`/v1/portal/tenants/${tenantId}/sources`), payload, {
        withCredentials: true,
      })
    );
  }

  tenantIngestions(tenantId: string, projectKey?: string): Promise<IngestionItem[]> {
    const suffix = projectKey ? `?projectKey=${encodeURIComponent(projectKey)}` : "";
    return firstValueFrom(
      this.http.get<IngestionItem[]>(this.url(`/v1/portal/tenants/${tenantId}/ingestions${suffix}`), {
        withCredentials: true,
      })
    );
  }

  queueIngestion(tenantId: string, payload: Record<string, unknown>): Promise<IngestionItem> {
    return firstValueFrom(
      this.http.post<IngestionItem>(this.url(`/v1/portal/tenants/${tenantId}/ingestions`), payload, {
        withCredentials: true,
      })
    );
  }

  tenantDocuments(tenantId: string, projectKey?: string): Promise<DocumentItem[]> {
    const suffix = projectKey ? `?projectKey=${encodeURIComponent(projectKey)}` : "";
    return firstValueFrom(
      this.http.get<DocumentItem[]>(this.url(`/v1/portal/tenants/${tenantId}/documents${suffix}`), {
        withCredentials: true,
      })
    );
  }

  tenantLeads(tenantId: string, projectKey?: string): Promise<LeadItem[]> {
    const suffix = projectKey ? `?projectKey=${encodeURIComponent(projectKey)}` : "";
    return firstValueFrom(
      this.http.get<LeadItem[]>(this.url(`/v1/portal/tenants/${tenantId}/leads${suffix}`), {
        withCredentials: true,
      })
    );
  }

  tenantConversations(tenantId: string, projectKey?: string): Promise<ConversationItem[]> {
    const suffix = projectKey ? `?projectKey=${encodeURIComponent(projectKey)}` : "";
    return firstValueFrom(
      this.http.get<ConversationItem[]>(this.url(`/v1/portal/tenants/${tenantId}/conversations${suffix}`), {
        withCredentials: true,
      })
    );
  }

  conversationMessages(tenantId: string, conversationId: string): Promise<MessageItem[]> {
    return firstValueFrom(
      this.http.get<MessageItem[]>(
        this.url(`/v1/portal/tenants/${tenantId}/conversations/${conversationId}/messages`),
        { withCredentials: true }
      )
    );
  }

  tenantAnalytics(tenantId: string, projectKey: string): Promise<{
    projectKey: string;
    events: Array<{ eventType: string; total: number }>;
    unanswered: Array<{ message: string; total: number }>;
    leads: Array<{ deliveryStatus: string; total: number }>;
  }> {
    return firstValueFrom(
      this.http.get<{
        projectKey: string;
        events: Array<{ eventType: string; total: number }>;
        unanswered: Array<{ message: string; total: number }>;
        leads: Array<{ deliveryStatus: string; total: number }>;
      }>(
        this.url(`/v1/portal/tenants/${tenantId}/analytics/summary?projectKey=${encodeURIComponent(projectKey)}`),
        { withCredentials: true }
      )
    );
  }

  adminOverview(): Promise<AdminOverview> {
    return firstValueFrom(
      this.http.get<AdminOverview>(this.url("/v1/admin/overview"), { withCredentials: true })
    );
  }

  adminPlatformSettings(): Promise<PortalSettings> {
    return firstValueFrom(
      this.http.get<PortalSettings>(this.url("/v1/admin/platform-settings"), { withCredentials: true })
    );
  }

  updatePlatformSettings(payload: Partial<PortalSettings>): Promise<PortalSettings> {
    return firstValueFrom(
      this.http.post<PortalSettings>(this.url("/v1/admin/platform-settings"), payload, {
        withCredentials: true,
      })
    );
  }

  adminAccessRequests(): Promise<AccessRequest[]> {
    return firstValueFrom(
      this.http.get<AccessRequest[]>(this.url("/v1/admin/access-requests"), {
        withCredentials: true,
      })
    );
  }

  reviewAccessRequest(accessRequestId: string, payload: Record<string, unknown>): Promise<unknown> {
    return firstValueFrom(
      this.http.post(this.url(`/v1/admin/access-requests/${accessRequestId}/review`), payload, {
        withCredentials: true,
      })
    );
  }

  adminTenants(): Promise<Tenant[]> {
    return firstValueFrom(
      this.http.get<Tenant[]>(this.url("/v1/admin/tenants"), { withCredentials: true })
    );
  }

  upsertTenant(payload: Record<string, unknown>): Promise<Tenant> {
    return firstValueFrom(
      this.http.post<Tenant>(this.url("/v1/admin/tenants"), payload, { withCredentials: true })
    );
  }

  adminUsers(): Promise<Array<PortalUser & { createdAt?: string; lastLoginAt?: string }>> {
    return firstValueFrom(
      this.http.get<Array<PortalUser & { createdAt?: string; lastLoginAt?: string }>>(
        this.url("/v1/admin/users"),
        { withCredentials: true }
      )
    );
  }

  upsertUser(payload: Record<string, unknown>): Promise<PortalUser> {
    return firstValueFrom(
      this.http.post<PortalUser>(this.url("/v1/admin/users"), payload, { withCredentials: true })
    );
  }

  upsertMembership(payload: Record<string, unknown>): Promise<PortalUser> {
    return firstValueFrom(
      this.http.post<PortalUser>(this.url("/v1/admin/memberships"), payload, { withCredentials: true })
    );
  }

  // --- Members ---
  tenantMembers(tenantId: string): Promise<WorkspaceMember[]> {
    return firstValueFrom(this.http.get<WorkspaceMember[]>(this.url(`/v1/portal/tenants/${tenantId}/members`), { withCredentials: true }));
  }

  updateMemberRole(tenantId: string, userId: string, role: string): Promise<WorkspaceMember> {
    return firstValueFrom(this.http.put<WorkspaceMember>(this.url(`/v1/portal/tenants/${tenantId}/members/${userId}`), { role }, { withCredentials: true }));
  }

  removeMember(tenantId: string, userId: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(this.url(`/v1/portal/tenants/${tenantId}/members/${userId}`), { withCredentials: true }));
  }

  inviteMember(tenantId: string, payload: { email: string; role: string }): Promise<{ message: string }> {
    return firstValueFrom(this.http.post<{ message: string }>(this.url(`/v1/portal/tenants/${tenantId}/invitations`), payload, { withCredentials: true }));
  }

  // --- API Keys ---
  listApiKeys(tenantId: string): Promise<ApiKey[]> {
    return firstValueFrom(this.http.get<ApiKey[]>(this.url(`/v1/portal/tenants/${tenantId}/api-keys`), { withCredentials: true }));
  }

  createApiKey(tenantId: string, payload: { name: string; scopes: string[]; expiresAt?: string }): Promise<ApiKeyCreated> {
    return firstValueFrom(this.http.post<ApiKeyCreated>(this.url(`/v1/portal/tenants/${tenantId}/api-keys`), payload, { withCredentials: true }));
  }

  deleteApiKey(tenantId: string, keyId: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(this.url(`/v1/portal/tenants/${tenantId}/api-keys/${keyId}`), { withCredentials: true }));
  }

  // --- Webhooks ---
  listWebhooks(tenantId: string): Promise<Webhook[]> {
    return firstValueFrom(this.http.get<Webhook[]>(this.url(`/v1/portal/tenants/${tenantId}/webhooks`), { withCredentials: true }));
  }

  createWebhook(tenantId: string, payload: { url: string; events: string[]; description?: string }): Promise<WebhookCreated> {
    return firstValueFrom(this.http.post<WebhookCreated>(this.url(`/v1/portal/tenants/${tenantId}/webhooks`), payload, { withCredentials: true }));
  }

  updateWebhook(tenantId: string, webhookId: string, payload: Partial<{ url: string; events: string[]; description: string; active: boolean }>): Promise<Webhook> {
    return firstValueFrom(this.http.put<Webhook>(this.url(`/v1/portal/tenants/${tenantId}/webhooks/${webhookId}`), payload, { withCredentials: true }));
  }

  deleteWebhook(tenantId: string, webhookId: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(this.url(`/v1/portal/tenants/${tenantId}/webhooks/${webhookId}`), { withCredentials: true }));
  }

  testWebhook(tenantId: string, webhookId: string): Promise<{ ok: boolean; statusCode: number }> {
    return firstValueFrom(this.http.post<{ ok: boolean; statusCode: number }>(this.url(`/v1/portal/tenants/${tenantId}/webhooks/${webhookId}/test`), {}, { withCredentials: true }));
  }

  // --- Ingestion Schedules ---
  listSchedules(tenantId: string): Promise<IngestionSchedule[]> {
    return firstValueFrom(this.http.get<IngestionSchedule[]>(this.url(`/v1/portal/tenants/${tenantId}/ingestion-schedules`), { withCredentials: true }));
  }

  createSchedule(tenantId: string, payload: { name: string; sourceIds: string[]; cronExpr: string }): Promise<IngestionSchedule> {
    return firstValueFrom(this.http.post<IngestionSchedule>(this.url(`/v1/portal/tenants/${tenantId}/ingestion-schedules`), payload, { withCredentials: true }));
  }

  updateSchedule(tenantId: string, scheduleId: string, payload: Partial<{ name: string; sourceIds: string[]; cronExpr: string; active: boolean }>): Promise<IngestionSchedule> {
    return firstValueFrom(this.http.put<IngestionSchedule>(this.url(`/v1/portal/tenants/${tenantId}/ingestion-schedules/${scheduleId}`), payload, { withCredentials: true }));
  }

  deleteSchedule(tenantId: string, scheduleId: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(this.url(`/v1/portal/tenants/${tenantId}/ingestion-schedules/${scheduleId}`), { withCredentials: true }));
  }

  // --- Notification Prefs ---
  getNotificationPrefs(tenantId: string): Promise<NotificationPrefs> {
    return firstValueFrom(this.http.get<NotificationPrefs>(this.url(`/v1/portal/tenants/${tenantId}/notification-prefs`), { withCredentials: true }));
  }

  updateNotificationPrefs(tenantId: string, payload: Partial<NotificationPrefs>): Promise<NotificationPrefs> {
    return firstValueFrom(this.http.put<NotificationPrefs>(this.url(`/v1/portal/tenants/${tenantId}/notification-prefs`), payload, { withCredentials: true }));
  }

  // --- Satisfaction (CSAT) ---
  satisfactionStats(tenantId: string, projectKey?: string): Promise<SatisfactionStats> {
    const q = projectKey ? `?projectKey=${projectKey}` : "";
    return firstValueFrom(this.http.get<SatisfactionStats>(this.url(`/v1/portal/tenants/${tenantId}/analytics/satisfaction${q}`), { withCredentials: true }));
  }

  // --- Bot Test Chat ---
  testChat(tenantId: string, projectKey: string, message: string): Promise<TestChatResponse> {
    return firstValueFrom(this.http.post<TestChatResponse>(this.url(`/v1/portal/tenants/${tenantId}/projects/${projectKey}/test-chat`), { message }, { withCredentials: true }));
  }

  // --- Exports ---
  exportConversations(tenantId: string): Promise<Blob> {
    return firstValueFrom(this.http.get(this.url(`/v1/portal/tenants/${tenantId}/export/conversations`), { withCredentials: true, responseType: "blob" }));
  }

  exportLeads(tenantId: string): Promise<Blob> {
    return firstValueFrom(this.http.get(this.url(`/v1/portal/tenants/${tenantId}/export/leads`), { withCredentials: true, responseType: "blob" }));
  }

  exportAnalytics(tenantId: string): Promise<Blob> {
    return firstValueFrom(this.http.get(this.url(`/v1/portal/tenants/${tenantId}/export/analytics`), { withCredentials: true, responseType: "blob" }));
  }

  // --- Conversation CSAT ---
  conversationRating(tenantId: string, conversationId: string): Promise<{ score: number; comment: string | null } | null> {
    return firstValueFrom(this.http.get<{ score: number; comment: string | null } | null>(this.url(`/v1/portal/tenants/${tenantId}/conversations/${conversationId}/rating`), { withCredentials: true }));
  }

  // --- Handover ---
  getHandover(tenantId: string, conversationId: string): Promise<HandoverEvent | null> {
    return firstValueFrom(this.http.get<HandoverEvent | null>(this.url(`/v1/portal/tenants/${tenantId}/conversations/${conversationId}/handover`), { withCredentials: true }));
  }

  updateHandover(tenantId: string, conversationId: string, status: "pending" | "assigned" | "closed"): Promise<HandoverEvent> {
    return firstValueFrom(this.http.put<HandoverEvent>(this.url(`/v1/portal/tenants/${tenantId}/conversations/${conversationId}/handover`), { status }, { withCredentials: true }));
  }

  // --- V2: Project Features ---
  updateProjectFeatures(tenantId: string, projectKey: string, features: { enableHandover: boolean }): Promise<{ projectKey: string; enableHandover: boolean }> {
    return firstValueFrom(this.http.put<{ projectKey: string; enableHandover: boolean }>(this.url(`/v1/portal/tenants/${tenantId}/projects/${projectKey}/features`), features, { withCredentials: true }));
  }

  // --- V2: AI Config ---
  getAiConfig(tenantId: string, projectKey: string): Promise<AiConfig> {
    return firstValueFrom(this.http.get<AiConfig>(this.url(`/v1/portal/tenants/${tenantId}/projects/${projectKey}/ai-config`), { withCredentials: true }));
  }

  updateAiConfig(tenantId: string, projectKey: string, config: AiConfig): Promise<AiConfig> {
    return firstValueFrom(this.http.put<AiConfig>(this.url(`/v1/portal/tenants/${tenantId}/projects/${projectKey}/ai-config`), config, { withCredentials: true }));
  }

  // --- V2: Handover Queue ---
  listHandovers(tenantId: string, status = "pending"): Promise<HandoverQueueItem[]> {
    return firstValueFrom(this.http.get<HandoverQueueItem[]>(this.url(`/v1/portal/tenants/${tenantId}/handovers?status=${status}`), { withCredentials: true }));
  }

  claimHandover(tenantId: string, handoverId: string): Promise<HandoverQueueItem> {
    return firstValueFrom(this.http.put<HandoverQueueItem>(this.url(`/v1/portal/tenants/${tenantId}/handovers/${handoverId}/claim`), {}, { withCredentials: true }));
  }

  resolveHandover(tenantId: string, handoverId: string, notes?: string): Promise<HandoverQueueItem> {
    return firstValueFrom(this.http.put<HandoverQueueItem>(this.url(`/v1/portal/tenants/${tenantId}/handovers/${handoverId}/resolve`), { notes }, { withCredentials: true }));
  }

  // --- V2: RAG Quality ---
  ragQuality(tenantId: string, projectKey?: string, period = "30d"): Promise<RagQualityStats> {
    const params = projectKey ? `?projectKey=${projectKey}&period=${period}` : `?period=${period}`;
    return firstValueFrom(this.http.get<RagQualityStats>(this.url(`/v1/portal/tenants/${tenantId}/analytics/rag-quality${params}`), { withCredentials: true }));
  }

  // --- V3-C: Analytics Trends ---
  analyticsTrends(tenantId: string, projectKey?: string, period = "30d"): Promise<AnalyticsTrends> {
    const params = projectKey ? `?projectKey=${projectKey}&period=${period}` : `?period=${period}`;
    return firstValueFrom(this.http.get<AnalyticsTrends>(this.url(`/v1/portal/tenants/${tenantId}/analytics/trends${params}`), { withCredentials: true }));
  }

  // --- V3-D: Channels ---
  listChannels(tenantId: string, projectKey: string): Promise<ChannelItem[]> {
    return firstValueFrom(this.http.get<ChannelItem[]>(this.url(`/v1/portal/tenants/${tenantId}/projects/${projectKey}/channels`), { withCredentials: true }));
  }

  createTelegramChannel(tenantId: string, projectKey: string, botToken: string): Promise<{ id: string; webhookUrl: string }> {
    return firstValueFrom(this.http.post<{ id: string; webhookUrl: string }>(this.url(`/v1/portal/tenants/${tenantId}/projects/${projectKey}/channels`), { botToken }, { withCredentials: true }));
  }

  deleteChannel(tenantId: string, projectKey: string, channelId: string): Promise<{ ok: boolean }> {
    return firstValueFrom(this.http.delete<{ ok: boolean }>(this.url(`/v1/portal/tenants/${tenantId}/projects/${projectKey}/channels/${channelId}`), { withCredentials: true }));
  }
}
