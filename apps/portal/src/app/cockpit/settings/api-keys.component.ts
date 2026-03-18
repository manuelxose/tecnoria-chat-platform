import { Component, OnInit, effect } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { CockpitStore } from "../cockpit-store.service";
import { PortalApiService } from "../../core/portal-api.service";
import { ApiKey } from "../../core/models";

@Component({
  selector: "app-api-keys",
  standalone: true,
  imports: [RouterModule, FormsModule],
  template: `
    <div class="ck-topbar">
      <div class="ck-topbar__breadcrumb">
        <span>Settings</span>
        <span>›</span>
        <strong>API Keys</strong>
      </div>
    </div>

    <div class="ck-content">
      <div class="ck-page-header">
        <div>
          <h1 class="ck-page-header__title">API Keys</h1>
          <p class="ck-page-header__sub">Authenticate programmatic access to the Talkaris API</p>
        </div>
        <button class="ck-btn ck-btn--primary ck-btn--sm" (click)="createOpen = !createOpen">+ New Key</button>
      </div>

      @if (newKey) {
        <div class="ck-card" style="margin-bottom: 20px; border-color: var(--ck-accent-soft);">
          <p class="ck-card__title" style="margin-bottom: 8px;">Key created — copy it now, it won't be shown again</p>
          <div style="display: flex; gap: 10px; align-items: center;">
            <code style="flex: 1; font-family: ui-monospace; font-size: 0.82rem; background: var(--ck-surface-high); padding: 10px 14px; border-radius: var(--ck-radius-sm); color: var(--ck-accent-strong); word-break: break-all;">{{ newKey }}</code>
            <button class="ck-btn ck-btn--secondary ck-btn--sm" (click)="copyKey()">{{ copied ? '✓' : 'Copy' }}</button>
          </div>
        </div>
      }

      @if (createOpen) {
        <div class="ck-card" style="margin-bottom: 20px;">
          <p class="ck-card__title" style="margin-bottom: 12px;">New API Key</p>
          <div style="display: grid; gap: 10px; max-width: 480px;">
            <input class="ck-input" placeholder="Key name" [(ngModel)]="form.name" />
            <div>
              <p style="font-size: 0.82rem; color: var(--ck-text-soft); margin-bottom: 6px;">Scopes</p>
              @for (scope of availableScopes; track scope) {
                <label style="display: flex; align-items: center; gap: 8px; font-size: 0.84rem; margin-bottom: 4px; cursor: pointer;">
                  <input type="checkbox" [checked]="form.scopes.includes(scope)" (change)="toggleScope(scope)" />
                  {{ scope }}
                </label>
              }
            </div>
            <div style="display: flex; gap: 10px;">
              <button class="ck-btn ck-btn--primary ck-btn--sm" (click)="create()" [disabled]="creating || !form.name">
                {{ creating ? 'Creating…' : 'Create Key' }}
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
              <th>Name</th>
              <th>Prefix</th>
              <th>Scopes</th>
              <th>Last Used</th>
              <th>Expires</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (k of keys; track k.id) {
              <tr>
                <td style="font-size: 0.84rem; font-weight: 500;">{{ k.name }}</td>
                <td><code style="font-size: 0.8rem; color: var(--ck-text-muted);">{{ k.prefix }}…</code></td>
                <td>
                  @for (s of k.scopes; track s) {
                    <span class="ck-badge ck-badge--default" style="margin-right: 4px; font-size: 0.75rem;">{{ s }}</span>
                  }
                  @if (!k.scopes.length) { <span style="color: var(--ck-text-muted); font-size: 0.8rem;">all</span> }
                </td>
                <td style="font-size: 0.8rem; color: var(--ck-text-muted);">{{ k.lastUsedAt ? (k.lastUsedAt | slice:0:10) : '—' }}</td>
                <td style="font-size: 0.8rem; color: var(--ck-text-muted);">{{ k.expiresAt ? (k.expiresAt | slice:0:10) : 'Never' }}</td>
                <td style="font-size: 0.8rem; color: var(--ck-text-muted);">{{ k.createdAt | slice:0:10 }}</td>
                <td>
                  <button class="ck-btn ck-btn--ghost ck-btn--sm" style="color: var(--ck-red);" (click)="revoke(k)">Revoke</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7" style="text-align: center; color: var(--ck-text-muted);">No API keys yet</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class ApiKeysComponent implements OnInit {
  keys: ApiKey[] = [];
  createOpen = false;
  creating = false;
  newKey: string | null = null;
  copied = false;
  form = { name: "", scopes: [] as string[] };
  readonly availableScopes = ["widget:read", "conversations:read", "leads:read", "analytics:read", "knowledge:write"];

  constructor(readonly store: CockpitStore, private readonly api: PortalApiService) {
    effect(() => {
      const id = this.store.activeTenantId();
      if (id) this.load(id);
    });
  }

  ngOnInit(): void {}

  private async load(tenantId: string): Promise<void> {
    this.keys = await this.api.listApiKeys(tenantId);
  }

  toggleScope(scope: string): void {
    const idx = this.form.scopes.indexOf(scope);
    if (idx >= 0) this.form.scopes.splice(idx, 1);
    else this.form.scopes.push(scope);
  }

  async create(): Promise<void> {
    const id = this.store.activeTenantId();
    if (!id || !this.form.name) return;
    this.creating = true;
    try {
      const created = await this.api.createApiKey(id, { name: this.form.name, scopes: this.form.scopes });
      this.newKey = created.key;
      this.keys.unshift(created);
      this.createOpen = false;
      this.form = { name: "", scopes: [] };
    } finally {
      this.creating = false;
    }
  }

  async revoke(k: ApiKey): Promise<void> {
    const id = this.store.activeTenantId();
    if (!id || !confirm(`Revoke "${k.name}"?`)) return;
    await this.api.deleteApiKey(id, k.id);
    this.keys = this.keys.filter((x) => x.id !== k.id);
  }

  copyKey(): void {
    if (!this.newKey) return;
    navigator.clipboard.writeText(this.newKey);
    this.copied = true;
    setTimeout(() => (this.copied = false), 2000);
  }
}
