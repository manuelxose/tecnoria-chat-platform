import { HttpClient } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { API_BASE_URL } from "./api-base-url.token";
import {
  AccessRequest,
  AdminOverview,
  BlogPostDetail,
  BlogPostSummary,
  ConversationItem,
  DocumentItem,
  IngestionItem,
  LeadItem,
  MessageItem,
  PlatformPublicResponse,
  PortalSettings,
  PortalUser,
  Project,
  SourceItem,
  Tenant,
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
}
