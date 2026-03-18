import { Component, OnInit, effect } from "@angular/core";
import { RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { CockpitStore } from "../cockpit-store.service";
import { PortalApiService } from "../../core/portal-api.service";
import { Project } from "../../core/models";

@Component({
  selector: "app-bots-list",
  standalone: true,
  imports: [RouterModule, FormsModule],
  template: `
    <div class="ck-topbar">
      <div class="ck-topbar__breadcrumb">
        <span>Bots</span>
        <span>›</span>
        <strong>All Bots</strong>
      </div>
      <div class="ck-topbar__actions">
        <a class="ck-btn ck-btn--primary ck-btn--sm" routerLink="/app/bots/new">+ New Bot</a>
      </div>
    </div>

    <div class="ck-content">
      <div class="ck-page-header">
        <div>
          <h1 class="ck-page-header__title">Bots</h1>
          <p class="ck-page-header__sub">All AI assistants in this workspace</p>
        </div>
        <div class="ck-page-header__actions">
          <a class="ck-btn ck-btn--primary" routerLink="/app/bots/new">+ Create Bot</a>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="ck-toolbar">
        <div class="ck-search-wrap">
          <span class="ck-search-icon">⌕</span>
          <input
            class="ck-input ck-search"
            type="text"
            placeholder="Search bots..."
            [(ngModel)]="searchQuery"
          />
        </div>
        <select class="ck-select" style="width: auto; min-width: 120px;" [(ngModel)]="filterStatus">
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      <!-- Bots table -->
      @if (loading) {
        <div class="ck-card">
          <div class="ck-skeleton" style="height: 40px; margin-bottom: 10px;"></div>
          <div class="ck-skeleton" style="height: 40px; margin-bottom: 10px;"></div>
          <div class="ck-skeleton" style="height: 40px;"></div>
        </div>
      } @else if (filtered.length > 0) {
        <div class="ck-table-wrap">
          <table class="ck-table">
            <thead>
              <tr>
                <th>Bot Name</th>
                <th>Project Key</th>
                <th>Status</th>
                <th>Language</th>
                <th>Domains</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (bot of filtered; track bot.id) {
                <tr>
                  <td>
                    <div class="ck-table__cell--strong">{{ bot.botName }}</div>
                    <div style="font-size: 0.78rem; color: var(--ck-text-muted);">{{ bot.name }}</div>
                  </td>
                  <td class="ck-table__cell--mono">{{ bot.projectKey }}</td>
                  <td>
                    <span class="ck-badge" [class]="statusBadge(bot.status)">
                      <span class="ck-dot"></span>
                      {{ bot.status ?? 'active' }}
                    </span>
                  </td>
                  <td style="color: var(--ck-text-muted); font-size: 0.82rem;">{{ bot.language }}</td>
                  <td style="color: var(--ck-text-muted); font-size: 0.78rem;">
                    {{ bot.allowedDomains.slice(0, 2).join(', ') }}{{ bot.allowedDomains.length > 2 ? '...' : '' }}
                  </td>
                  <td>
                    <div style="display: flex; gap: 6px;">
                      <a class="ck-btn ck-btn--ghost ck-btn--sm" [routerLink]="['/app/bots', bot.projectKey]">
                        Edit
                      </a>
                      <button class="ck-btn ck-btn--ghost ck-btn--sm" (click)="copySnippet(bot.projectKey)">
                        {{ copiedKey === bot.projectKey ? '✓ Copied' : 'Snippet' }}
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <div class="ck-card">
          <div class="ck-empty">
            <div class="ck-empty__icon">◈</div>
            <p class="ck-empty__title">{{ searchQuery ? 'No results found' : 'No bots yet' }}</p>
            <p class="ck-empty__sub">
              {{ searchQuery ? 'Try a different search term.' : 'Create your first AI assistant to deploy on your website.' }}
            </p>
            @if (!searchQuery) {
              <a class="ck-btn ck-btn--primary" routerLink="/app/bots/new">Create Bot</a>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class BotsListComponent implements OnInit {
  bots: Project[] = [];
  loading = true;
  searchQuery = "";
  filterStatus = "";
  copiedKey = "";

  get filtered(): Project[] {
    return this.bots.filter((b) => {
      const matchSearch =
        !this.searchQuery ||
        b.botName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        b.projectKey.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        b.name.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchStatus = !this.filterStatus || (b.status ?? "active") === this.filterStatus;
      return matchSearch && matchStatus;
    });
  }

  constructor(
    private readonly store: CockpitStore,
    private readonly api: PortalApiService
  ) {
    effect(() => {
      const id = this.store.activeTenantId();
      if (id) this.load(id);
    });
  }

  async ngOnInit(): Promise<void> {
    const id = this.store.activeTenantId();
    if (id) await this.load(id);
  }

  private async load(tenantId: string): Promise<void> {
    this.loading = true;
    try {
      this.bots = await this.api.tenantProjects(tenantId);
    } finally {
      this.loading = false;
    }
  }

  async copySnippet(projectKey: string): Promise<void> {
    const tenantId = this.store.activeTenantId();
    if (!tenantId) return;
    const data = await this.api.projectSnippet(tenantId, projectKey);
    await navigator.clipboard.writeText(data.snippet);
    this.copiedKey = projectKey;
    setTimeout(() => (this.copiedKey = ""), 2000);
  }

  statusBadge(status?: string): string {
    switch (status) {
      case "active": return "ck-badge ck-badge--success";
      case "draft": return "ck-badge ck-badge--warning";
      case "disabled": return "ck-badge ck-badge--default";
      default: return "ck-badge ck-badge--success";
    }
  }
}
