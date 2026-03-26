import { Component, OnInit, effect } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { CockpitStore } from "../cockpit-store.service";
import { PortalApiService } from "../../core/portal-api.service";
import { Project } from "../../core/models";

@Component({
  selector: "app-developers",
  standalone: true,
  imports: [RouterModule, FormsModule],
  template: `
    <div class="ck-topbar">
      <div class="ck-topbar__breadcrumb">
        <strong>Developers</strong>
      </div>
    </div>

    <div class="ck-content">
      <div class="ck-page-header">
        <div>
          <h1 class="ck-page-header__title">Connect Website</h1>
          <p class="ck-page-header__sub">Provision ingestion and widget embed from one canonical website flow.</p>
        </div>
      </div>

      <div class="ck-card ck-auto-019">
        <div class="ck-card__header">
          <div>
            <p class="ck-card__title">Website Integration</p>
            <p class="ck-card__sub">Talkaris detects the sitemap first, falls back to crawl, queues ingestion and returns the live snippet.</p>
          </div>
          <button class="ck-btn ck-btn--secondary ck-btn--sm" (click)="copy()" [disabled]="!snippetText">
            {{ copied ? '✓ Copied' : 'Copy Code' }}
          </button>
        </div>

        <div class="ck-form-stack">
          <div class="ck-auto-143">
            <select class="ck-select ck-auto-144" [(ngModel)]="selectedProjectKey" (ngModelChange)="loadSnippet($event)">
              <option value="">Select a bot…</option>
              @for (p of projects; track p.projectKey) {
                <option [value]="p.projectKey">{{ p.botName }} · {{ p.projectKey }}</option>
              }
            </select>
            @if (loadingSnippet) {
              <span class="ck-auto-145">Loading…</span>
            }
          </div>

          <div class="ck-form-inline">
            <input class="ck-input ck-grow" [(ngModel)]="websiteBaseUrl" placeholder="https://example.com" />
            <button class="ck-btn ck-btn--primary" (click)="connectWebsite()" [disabled]="provisioning || !selectedProjectKey || !websiteBaseUrl.trim()">
              {{ provisioning ? 'Provisioning…' : 'Connect Website' }}
            </button>
          </div>

          <p class="ck-text-sm ck-text-muted">
            Use the same result for Angular, Node/SSR, WordPress and plain HTML. No framework-specific runtime is required.
          </p>

          @if (websiteStatus) {
            <div class="ck-alert ck-alert--success">{{ websiteStatus }}</div>
          }
          @if (websiteError) {
            <div class="ck-alert ck-alert--danger">{{ websiteError }}</div>
          }

          @if (snippetText) {
            <pre class="ck-code">{{ snippetText }}</pre>
          } @else if (selectedProjectKey) {
            <div class="ck-skeleton ck-auto-052"></div>
          } @else {
            <div class="ck-auto-146">
              Select a bot and connect a website to generate its canonical embed snippet.
            </div>
          }
        </div>
      </div>

      <div class="ck-grid-two">
        <!-- Widget API -->
        <div class="ck-card">
          <div class="ck-card__header">
            <div>
              <p class="ck-card__title">Widget JavaScript API</p>
              <p class="ck-card__sub">Control the widget programmatically</p>
            </div>
          </div>
          <div class="ck-form-stack">
            <div>
              <p class="ck-section-title">Global Config</p>
              <pre class="ck-code ck-auto-147">window.TalkarisWidgetConfig = &#123;
  siteKey: "YOUR_SITE_KEY",
  apiBase: "https://talkaris.com/api",
  widgetBaseUrl: "https://talkaris.com/widget/"
&#125;;</pre>
            </div>
            <div>
              <p class="ck-section-title">Embed Contract</p>
              <pre class="ck-code ck-auto-147">&lt;script async src="https://talkaris.com/widget/embed.js"&gt;&lt;/script&gt;

The widget bootstrap is configured through window.TalkarisWidgetConfig.
No extra SDK wiring is required for a standard website embed.</pre>
            </div>
          </div>
        </div>

        <!-- REST API -->
        <div class="ck-card">
          <div class="ck-card__header">
            <div>
              <p class="ck-card__title">REST API</p>
              <p class="ck-card__sub">Direct API access endpoints</p>
            </div>
            <span class="ck-badge ck-badge--accent">v1</span>
          </div>
          <div class="ck-auto-138">
            @for (endpoint of apiEndpoints; track endpoint.path) {
              <div class="ck-auto-148">
                <span class="ck-badge ck-auto-149" [class]="methodBadge(endpoint.method)" >
                  {{ endpoint.method }}
                </span>
                <span class="ck-auto-150">
                  {{ endpoint.path }}
                </span>
                <span class="ck-auto-063">{{ endpoint.desc }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Webhooks -->
        <div class="ck-card">
          <div class="ck-card__header">
            <div>
              <p class="ck-card__title">Webhooks</p>
              <p class="ck-card__sub">Receive lead events via HTTP</p>
            </div>
          </div>
          <p class="ck-auto-151">
            Configure a webhook URL in your bot settings to receive lead submissions in real time.
          </p>
          <div class="ck-auto-152">
            <strong class="ck-auto-076">Payload example:</strong>
            <pre class="ck-code ck-auto-153">&#123;
  "event": "lead_submitted",
  "projectKey": "my-bot",
  "conversationId": "uuid",
  "data": &#123;
    "name": "John Doe",
    "email": "john&#64;example.com"
  &#125;
&#125;</pre>
          </div>
          <a class="ck-btn ck-btn--secondary ck-auto-154" routerLink="/app/bots">
            Configure in Bot Settings →
          </a>
        </div>

        <!-- SDK info -->
        <div class="ck-card">
          <div class="ck-card__header">
            <div>
              <p class="ck-card__title">SDK & Resources</p>
            </div>
          </div>
          <div class="ck-auto-138">
            <div class="ck-auto-155">
              <div class="ck-auto-156">Embed Script</div>
              <div class="ck-auto-077">Lightweight JS widget loader used by every supported website stack.</div>
            </div>
            <div class="ck-auto-155">
              <div class="ck-auto-156">Website Provisioning</div>
              <div class="ck-auto-077">Canonical flow: detect sitemap, create source, queue ingestion, return snippet.</div>
            </div>
            <div class="ck-auto-155">
              <div class="ck-auto-156">Webhooks</div>
              <div class="ck-auto-077">Real-time event delivery to your backend.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DevelopersComponent implements OnInit {
  projects: Project[] = [];
  selectedProjectKey = "";
  websiteBaseUrl = "";
  snippetText = "";
  loadingSnippet = false;
  provisioning = false;
  websiteStatus = "";
  websiteError = "";
  copied = false;

  readonly apiEndpoints = [
    { method: "GET", path: "/v1/widget/config/:siteKey", desc: "Widget config" },
    { method: "POST", path: "/v1/widget/sessions", desc: "Start session" },
    { method: "POST", path: "/v1/widget/messages", desc: "Send message" },
    { method: "POST", path: "/v1/widget/leads", desc: "Submit lead" },
    { method: "POST", path: "/v1/widget/events", desc: "Log event" },
    { method: "POST", path: "/v1/portal/tenants/:tenantId/projects/:projectKey/website-integration", desc: "Provision website source + ingestion" },
  ];

  constructor(
    private readonly store: CockpitStore,
    private readonly api: PortalApiService
  ) {
    effect(() => {
      const id = this.store.activeTenantId();
      if (id) this.loadProjects(id);
    });
  }

  async ngOnInit(): Promise<void> {
    const id = this.store.activeTenantId();
    if (id) await this.loadProjects(id);
  }

  private async loadProjects(tenantId: string): Promise<void> {
    this.projects = await this.api.tenantProjects(tenantId);
  }

  async loadSnippet(projectKey: string): Promise<void> {
    if (!projectKey) return;
    const tenantId = this.store.activeTenantId();
    if (!tenantId) return;
    const selected = this.projects.find((project) => project.projectKey === projectKey);
    this.websiteBaseUrl = selected?.publicBaseUrl ?? this.websiteBaseUrl;
    this.loadingSnippet = true;
    this.websiteStatus = "";
    this.websiteError = "";
    try {
      const data = await this.api.projectSnippet(tenantId, projectKey);
      this.snippetText = data.snippet;
    } finally {
      this.loadingSnippet = false;
    }
  }

  async connectWebsite(): Promise<void> {
    const tenantId = this.store.activeTenantId();
    if (!tenantId || !this.selectedProjectKey || !this.websiteBaseUrl.trim()) {
      return;
    }

    this.provisioning = true;
    this.websiteStatus = "";
    this.websiteError = "";
    try {
      const result = await this.api.provisionWebsiteIntegration(
        tenantId,
        this.selectedProjectKey,
        this.websiteBaseUrl.trim()
      );
      this.snippetText = result.snippet;
      this.websiteStatus = `Detected ${result.detectedMode} at ${result.entryUrl}. Ingestion job ${result.ingestionJobId.slice(0, 8)}… queued for ${result.sourceKey}.`;
    } catch (error: any) {
      this.websiteError = error?.message ?? "Website provisioning failed.";
    } finally {
      this.provisioning = false;
    }
  }

  async copy(): Promise<void> {
    if (!this.snippetText) return;
    await navigator.clipboard.writeText(this.snippetText);
    this.copied = true;
    setTimeout(() => (this.copied = false), 2000);
  }

  methodBadge(method: string): string {
    switch (method) {
      case "GET": return "ck-badge ck-badge--success";
      case "POST": return "ck-badge ck-badge--accent";
      case "PUT": return "ck-badge ck-badge--warning";
      case "DELETE": return "ck-badge ck-badge--danger";
      default: return "ck-badge ck-badge--default";
    }
  }
}
