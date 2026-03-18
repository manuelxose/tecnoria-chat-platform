import { Component, OnInit, effect } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { CockpitStore } from "../cockpit-store.service";
import { PortalApiService } from "../../core/portal-api.service";
import { Webhook } from "../../core/models";

const ALL_EVENTS = [
  "conversation.started",
  "conversation.ended",
  "lead.captured",
  "message.sent",
  "ingestion.completed",
  "ingestion.failed",
];

@Component({
  selector: "app-webhooks",
  standalone: true,
  imports: [RouterModule, FormsModule],
  template: `
    <div class="ck-topbar">
      <div class="ck-topbar__breadcrumb">
        <span>Settings</span>
        <span>›</span>
        <strong>Webhooks</strong>
      </div>
    </div>

    <div class="ck-content">
      <div class="ck-page-header">
        <div>
          <h1 class="ck-page-header__title">Webhooks</h1>
          <p class="ck-page-header__sub">Receive real-time HTTP notifications for platform events</p>
        </div>
        <button class="ck-btn ck-btn--primary ck-btn--sm" (click)="createOpen = !createOpen">+ Add Webhook</button>
      </div>

      @if (secret) {
        <div class="ck-card" style="margin-bottom: 20px; border-color: var(--ck-accent-soft);">
          <p class="ck-card__title" style="margin-bottom: 8px;">Webhook secret — copy it now, it won't be shown again</p>
          <div style="display: flex; gap: 10px; align-items: center;">
            <code style="flex: 1; font-size: 0.82rem; font-family: ui-monospace; background: var(--ck-surface-high); padding: 10px 14px; border-radius: var(--ck-radius-sm); color: var(--ck-accent-strong); word-break: break-all;">{{ secret }}</code>
            <button class="ck-btn ck-btn--secondary ck-btn--sm" (click)="copySecret()">{{ copied ? '✓' : 'Copy' }}</button>
          </div>
        </div>
      }

      @if (createOpen) {
        <div class="ck-card" style="margin-bottom: 20px;">
          <p class="ck-card__title" style="margin-bottom: 12px;">New Webhook</p>
          <div style="display: grid; gap: 10px; max-width: 520px;">
            <input class="ck-input" placeholder="https://your-server.com/webhook" [(ngModel)]="form.url" />
            <input class="ck-input" placeholder="Description (optional)" [(ngModel)]="form.description" />
            <div>
              <p style="font-size: 0.82rem; color: var(--ck-text-soft); margin-bottom: 6px;">Events to listen for</p>
              @for (ev of allEvents; track ev) {
                <label style="display: flex; align-items: center; gap: 8px; font-size: 0.84rem; margin-bottom: 4px; cursor: pointer;">
                  <input type="checkbox" [checked]="form.events.includes(ev)" (change)="toggleEvent(ev)" />
                  {{ ev }}
                </label>
              }
            </div>
            <div style="display: flex; gap: 10px;">
              <button class="ck-btn ck-btn--primary ck-btn--sm" (click)="create()" [disabled]="creating || !form.url || !form.events.length">
                {{ creating ? 'Creating…' : 'Create Webhook' }}
              </button>
              <button class="ck-btn ck-btn--ghost ck-btn--sm" (click)="createOpen = false">Cancel</button>
            </div>
          </div>
        </div>
      }

      <div class="ck-table-wrap">
        <table class="ck-table">
          <thead>
            <tr>
              <th>URL</th>
              <th>Events</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (wh of webhooks; track wh.id) {
              <tr>
                <td>
                  <div style="display: flex; flex-direction: column; gap: 2px;">
                    <span style="font-size: 0.82rem; font-family: ui-monospace; color: var(--ck-text);">{{ wh.url }}</span>
                    @if (wh.description) {
                      <span style="font-size: 0.78rem; color: var(--ck-text-muted);">{{ wh.description }}</span>
                    }
                  </div>
                </td>
                <td>
                  @for (ev of wh.events.slice(0, 3); track ev) {
                    <span class="ck-badge ck-badge--default" style="margin-right: 4px; font-size: 0.72rem;">{{ ev }}</span>
                  }
                  @if (wh.events.length > 3) {
                    <span style="font-size: 0.78rem; color: var(--ck-text-muted);">+{{ wh.events.length - 3 }} more</span>
                  }
                </td>
                <td>
                  <span class="ck-badge" [class]="wh.active ? 'ck-badge--success' : 'ck-badge--default'">
                    {{ wh.active ? 'Active' : 'Paused' }}
                  </span>
                </td>
                <td>
                  <div style="display: flex; gap: 8px;">
                    <button class="ck-btn ck-btn--ghost ck-btn--sm" (click)="test(wh)" [disabled]="testing === wh.id">
                      {{ testing === wh.id ? '…' : 'Test' }}
                    </button>
                    <button class="ck-btn ck-btn--ghost ck-btn--sm" (click)="toggle(wh)">
                      {{ wh.active ? 'Pause' : 'Enable' }}
                    </button>
                    <button class="ck-btn ck-btn--ghost ck-btn--sm" style="color: var(--ck-red);" (click)="remove(wh)">Delete</button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="4" style="text-align: center; color: var(--ck-text-muted);">No webhooks configured</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class WebhooksComponent implements OnInit {
  webhooks: Webhook[] = [];
  createOpen = false;
  creating = false;
  testing: string | null = null;
  secret: string | null = null;
  copied = false;
  form = { url: "", description: "", events: [] as string[] };
  readonly allEvents = ALL_EVENTS;

  constructor(readonly store: CockpitStore, private readonly api: PortalApiService) {
    effect(() => {
      const id = this.store.activeTenantId();
      if (id) this.load(id);
    });
  }

  ngOnInit(): void {}

  private async load(tenantId: string): Promise<void> {
    this.webhooks = await this.api.listWebhooks(tenantId);
  }

  toggleEvent(ev: string): void {
    const idx = this.form.events.indexOf(ev);
    if (idx >= 0) this.form.events.splice(idx, 1);
    else this.form.events.push(ev);
  }

  async create(): Promise<void> {
    const id = this.store.activeTenantId();
    if (!id) return;
    this.creating = true;
    try {
      const created = await this.api.createWebhook(id, { url: this.form.url, events: this.form.events, description: this.form.description || undefined });
      this.secret = created.secret;
      this.webhooks.unshift(created);
      this.createOpen = false;
      this.form = { url: "", description: "", events: [] };
    } finally {
      this.creating = false;
    }
  }

  async test(wh: Webhook): Promise<void> {
    const id = this.store.activeTenantId();
    if (!id) return;
    this.testing = wh.id;
    try {
      const r = await this.api.testWebhook(id, wh.id);
      alert(r.ok ? `Success (HTTP ${r.statusCode})` : `Failed (HTTP ${r.statusCode})`);
    } finally {
      this.testing = null;
    }
  }

  async toggle(wh: Webhook): Promise<void> {
    const id = this.store.activeTenantId();
    if (!id) return;
    const updated = await this.api.updateWebhook(id, wh.id, { active: !wh.active });
    const idx = this.webhooks.findIndex((x) => x.id === wh.id);
    if (idx >= 0) this.webhooks[idx] = updated;
  }

  async remove(wh: Webhook): Promise<void> {
    const id = this.store.activeTenantId();
    if (!id || !confirm(`Delete webhook for ${wh.url}?`)) return;
    await this.api.deleteWebhook(id, wh.id);
    this.webhooks = this.webhooks.filter((x) => x.id !== wh.id);
  }

  copySecret(): void {
    if (!this.secret) return;
    navigator.clipboard.writeText(this.secret);
    this.copied = true;
    setTimeout(() => (this.copied = false), 2000);
  }
}
