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
          <h1 class="ck-page-header__title">API & Embed</h1>
          <p class="ck-page-header__sub">Integration tools for developers</p>
        </div>
      </div>

      <!-- Bot selector for snippet -->
      <div class="ck-card" style="margin-bottom: 20px;">
        <div class="ck-card__header">
          <div>
            <p class="ck-card__title">Embed Snippet</p>
            <p class="ck-card__sub">Add this code to your website to embed the chat widget</p>
          </div>
          <button class="ck-btn ck-btn--secondary ck-btn--sm" (click)="copy()" [disabled]="!snippetText">
            {{ copied ? '✓ Copied' : 'Copy Code' }}
          </button>
        </div>

        <div style="display: flex; gap: 12px; margin-bottom: 14px;">
          <select class="ck-select" style="max-width: 300px;" [(ngModel)]="selectedProjectKey" (ngModelChange)="loadSnippet($event)">
            <option value="">Select a bot…</option>
            @for (p of projects; track p.projectKey) {
              <option [value]="p.projectKey">{{ p.botName }} · {{ p.projectKey }}</option>
            }
          </select>
          @if (loadingSnippet) {
            <span style="display: flex; align-items: center; color: var(--ck-text-muted); font-size: 0.84rem;">Loading…</span>
          }
        </div>

        @if (snippetText) {
          <pre class="ck-code">{{ snippetText }}</pre>
        } @else if (selectedProjectKey) {
          <div class="ck-skeleton" style="height: 80px;"></div>
        } @else {
          <div style="background: var(--ck-surface-raised); border: 1px dashed var(--ck-border-strong); border-radius: var(--ck-radius); padding: 24px; text-align: center; color: var(--ck-text-muted); font-size: 0.84rem;">
            Select a bot above to generate its embed snippet
          </div>
        }
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
              <pre class="ck-code" style="font-size: 0.75rem;">window.TalkarisWidgetConfig = &#123;
  siteKey: "YOUR_SITE_KEY",
  apiBase: "https://api.talkaris.com",
  widgetBase: "https://widget.talkaris.com"
&#125;;</pre>
            </div>
            <div>
              <p class="ck-section-title">Events</p>
              <pre class="ck-code" style="font-size: 0.75rem;">// Widget opened
window.addEventListener('talkaris:opened', () => &#123;&#125;)

// Lead submitted
window.addEventListener('talkaris:lead', (e) => &#123;
  console.log(e.detail)
&#125;)</pre>
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
          <div style="display: grid; gap: 8px;">
            @for (endpoint of apiEndpoints; track endpoint.path) {
              <div style="display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: var(--ck-radius-sm); border: 1px solid var(--ck-border); background: var(--ck-surface-raised);">
                <span class="ck-badge" [class]="methodBadge(endpoint.method)" style="min-width: 46px; justify-content: center; font-size: 0.68rem;">
                  {{ endpoint.method }}
                </span>
                <span style="font-family: ui-monospace; font-size: 0.78rem; color: var(--ck-text-soft); flex: 1;">
                  {{ endpoint.path }}
                </span>
                <span style="font-size: 0.72rem; color: var(--ck-text-muted);">{{ endpoint.desc }}</span>
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
          <p style="font-size: 0.84rem; color: var(--ck-text-soft); margin: 0 0 12px;">
            Configure a webhook URL in your bot settings to receive lead submissions in real time.
          </p>
          <div style="background: var(--ck-surface-raised); border-radius: var(--ck-radius); padding: 12px; font-size: 0.8rem; color: var(--ck-text-soft);">
            <strong style="color: var(--ck-text);">Payload example:</strong>
            <pre class="ck-code" style="margin-top: 8px; font-size: 0.73rem;">&#123;
  "event": "lead_submitted",
  "projectKey": "my-bot",
  "conversationId": "uuid",
  "data": &#123;
    "name": "John Doe",
    "email": "john&#64;example.com"
  &#125;
&#125;</pre>
          </div>
          <a class="ck-btn ck-btn--secondary" style="margin-top: 12px; width: 100%; justify-content: center;" routerLink="/app/bots">
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
          <div style="display: grid; gap: 8px;">
            <div style="padding: 12px; border-radius: var(--ck-radius); border: 1px solid var(--ck-border); background: var(--ck-surface-raised);">
              <div style="font-size: 0.84rem; font-weight: 700; color: var(--ck-text); margin-bottom: 4px;">Embed Script</div>
              <div style="font-size: 0.78rem; color: var(--ck-text-muted);">Lightweight JS widget loader (&lt;2KB gzip)</div>
            </div>
            <div style="padding: 12px; border-radius: var(--ck-radius); border: 1px solid var(--ck-border); background: var(--ck-surface-raised);">
              <div style="font-size: 0.84rem; font-weight: 700; color: var(--ck-text); margin-bottom: 4px;">REST API</div>
              <div style="font-size: 0.78rem; color: var(--ck-text-muted);">Full HTTP API for custom integrations</div>
            </div>
            <div style="padding: 12px; border-radius: var(--ck-radius); border: 1px solid var(--ck-border); background: var(--ck-surface-raised);">
              <div style="font-size: 0.84rem; font-weight: 700; color: var(--ck-text); margin-bottom: 4px;">Webhooks</div>
              <div style="font-size: 0.78rem; color: var(--ck-text-muted);">Real-time event delivery to your backend</div>
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
  snippetText = "";
  loadingSnippet = false;
  copied = false;

  readonly apiEndpoints = [
    { method: "GET", path: "/v1/widget/config/:siteKey", desc: "Widget config" },
    { method: "POST", path: "/v1/widget/sessions", desc: "Start session" },
    { method: "POST", path: "/v1/widget/messages", desc: "Send message" },
    { method: "POST", path: "/v1/widget/leads", desc: "Submit lead" },
    { method: "POST", path: "/v1/widget/events", desc: "Log event" },
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
    this.loadingSnippet = true;
    try {
      const data = await this.api.projectSnippet(tenantId, projectKey);
      this.snippetText = data.snippet;
    } finally {
      this.loadingSnippet = false;
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
