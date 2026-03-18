import { Component, OnInit, effect } from "@angular/core";
import { RouterModule } from "@angular/router";
import { CockpitStore } from "../cockpit-store.service";
import { PortalApiService } from "../../core/portal-api.service";
import { SessionStore } from "../../core/session.store";
import { Project, IngestionItem, SatisfactionStats } from "../../core/models";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="ck-topbar">
      <div class="ck-topbar__breadcrumb">
        <strong>Dashboard</strong>
      </div>
      <div class="ck-topbar__actions">
        <a class="ck-btn ck-btn--primary ck-btn--sm" routerLink="/app/bots/new">+ New Bot</a>
      </div>
    </div>

    <div class="ck-content">
      <!-- Page header -->
      <div class="ck-page-header">
        <div>
          <h1 class="ck-page-header__title">
            Good {{ greeting }}, {{ firstName }}
          </h1>
          <p class="ck-page-header__sub">
            {{ store.activeTenant()?.name ?? 'Your workspace' }} · Platform overview
          </p>
        </div>
      </div>

      <!-- Stats row -->
      <div class="ck-stats">
        <div class="ck-stat">
          <div class="ck-stat__label">Active Bots</div>
          <div class="ck-stat__value">{{ overview?.stats?.['projects'] ?? '—' }}</div>
          <div class="ck-stat__delta">Deployed projects</div>
        </div>
        <div class="ck-stat">
          <div class="ck-stat__label">Conversations</div>
          <div class="ck-stat__value">{{ overview?.stats?.['conversations'] ?? '—' }}</div>
          <div class="ck-stat__delta">All time</div>
        </div>
        <div class="ck-stat">
          <div class="ck-stat__label">Knowledge Sources</div>
          <div class="ck-stat__value">{{ overview?.stats?.['sources'] ?? '—' }}</div>
          <div class="ck-stat__delta">Connected</div>
        </div>
        <div class="ck-stat">
          <div class="ck-stat__label">Ingestion Jobs</div>
          <div class="ck-stat__value">{{ recentJobs.length }}</div>
          <div class="ck-stat__delta">Recent activity</div>
        </div>
        @if (csat) {
          <div class="ck-stat">
            <div class="ck-stat__label">Avg CSAT</div>
            <div class="ck-stat__value" [style.color]="csatColor(csat.avg)">{{ csat.avg.toFixed(1) }} ★</div>
            <div class="ck-stat__delta">{{ csat.total }} ratings</div>
          </div>
        }
      </div>

      <div class="ck-grid-two">
        <!-- Active bots -->
        <div class="ck-card">
          <div class="ck-card__header">
            <div>
              <p class="ck-card__title">Bots</p>
              <p class="ck-card__sub">Your active AI assistants</p>
            </div>
            <a class="ck-btn ck-btn--secondary ck-btn--sm" routerLink="/app/bots">View all</a>
          </div>

          @if (projects.length > 0) {
            <div class="ck-table-wrap">
              <table class="ck-table">
                <thead>
                  <tr>
                    <th>Bot</th>
                    <th>Key</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  @for (bot of projects.slice(0, 5); track bot.id) {
                    <tr>
                      <td class="ck-table__cell--strong">{{ bot.botName }}</td>
                      <td class="ck-table__cell--mono">{{ bot.projectKey }}</td>
                      <td>
                        <span class="ck-badge" [class]="statusBadgeClass(bot.status)">
                          <span class="ck-dot"></span>
                          {{ bot.status ?? 'active' }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <div class="ck-empty">
              <div class="ck-empty__icon">◈</div>
              <p class="ck-empty__title">No bots yet</p>
              <p class="ck-empty__sub">Create your first AI assistant to get started.</p>
              <a class="ck-btn ck-btn--primary" routerLink="/app/bots/new">Create Bot</a>
            </div>
          }
        </div>

        <!-- Recent ingestion activity -->
        <div class="ck-card">
          <div class="ck-card__header">
            <div>
              <p class="ck-card__title">Ingestion Activity</p>
              <p class="ck-card__sub">Recent knowledge sync jobs</p>
            </div>
            <a class="ck-btn ck-btn--secondary ck-btn--sm" routerLink="/app/knowledge/ingestions">View all</a>
          </div>

          @if (recentJobs.length > 0) {
            <div class="ck-table-wrap">
              <table class="ck-table">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  @for (job of recentJobs.slice(0, 5); track job.id) {
                    <tr>
                      <td class="ck-table__cell--mono">{{ job.projectKey }}/{{ job.sourceKey }}</td>
                      <td>
                        <span class="ck-badge" [class]="ingestionBadgeClass(job.status)">
                          {{ job.status }}
                        </span>
                      </td>
                      <td style="color: var(--ck-text-muted); font-size: 0.78rem;">
                        {{ job.createdAt | date: 'MMM d, HH:mm' }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <div class="ck-empty">
              <div class="ck-empty__icon">↻</div>
              <p class="ck-empty__title">No recent ingestions</p>
              <p class="ck-empty__sub">Sync knowledge sources to populate your bots.</p>
              <a class="ck-btn ck-btn--secondary" routerLink="/app/knowledge">Manage Sources</a>
            </div>
          }
        </div>

        <!-- Quick actions -->
        <div class="ck-card">
          <div class="ck-card__header">
            <p class="ck-card__title">Quick Actions</p>
          </div>
          <div style="display: grid; gap: 8px;">
            <a class="ck-btn ck-btn--secondary" routerLink="/app/bots/new" style="justify-content: flex-start;">
              <span>+</span> Create new bot
            </a>
            @if (projects.length > 0) {
              <a class="ck-btn ck-btn--secondary" [routerLink]="['/app/bots', projects[0].projectKey, 'test']" style="justify-content: flex-start;">
                <span>▷</span> Test bot playground
              </a>
            }
            <a class="ck-btn ck-btn--secondary" routerLink="/app/knowledge" style="justify-content: flex-start;">
              <span>◫</span> Add knowledge source
            </a>
            <a class="ck-btn ck-btn--secondary" routerLink="/app/conversations" style="justify-content: flex-start;">
              <span>◎</span> View conversations
            </a>
            <a class="ck-btn ck-btn--secondary" routerLink="/app/analytics" style="justify-content: flex-start;">
              <span>▣</span> Check analytics
            </a>
            <a class="ck-btn ck-btn--secondary" routerLink="/app/settings/members" style="justify-content: flex-start;">
              <span>◎</span> Invite team member
            </a>
            <a class="ck-btn ck-btn--secondary" routerLink="/app/developers" style="justify-content: flex-start;">
              <span>⌗</span> Get embed snippet
            </a>
          </div>
        </div>

        <!-- Platform status -->
        <div class="ck-card">
          <div class="ck-card__header">
            <p class="ck-card__title">Platform Status</p>
          </div>
          <div style="display: grid; gap: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 0.84rem; color: var(--ck-text-soft);">API</span>
              <span class="ck-badge ck-badge--success"><span class="ck-dot"></span> Operational</span>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 0.84rem; color: var(--ck-text-soft);">Widget CDN</span>
              <span class="ck-badge ck-badge--success"><span class="ck-dot"></span> Operational</span>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 0.84rem; color: var(--ck-text-soft);">Ingest Worker</span>
              <span class="ck-badge ck-badge--success"><span class="ck-dot"></span> Operational</span>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 0.84rem; color: var(--ck-text-soft);">Knowledge Search</span>
              <span class="ck-badge ck-badge--success"><span class="ck-dot"></span> Operational</span>
            </div>
          </div>
          <div class="ck-divider"></div>
          <p style="font-size: 0.78rem; color: var(--ck-text-muted); margin: 0;">
            All systems nominal · Updated just now
          </p>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  overview: { tenant: any; stats: Record<string, number>; recentJobs: IngestionItem[] } | null = null;
  projects: Project[] = [];
  recentJobs: IngestionItem[] = [];
  csat: SatisfactionStats | null = null;

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return "morning";
    if (h < 18) return "afternoon";
    return "evening";
  }

  get firstName(): string {
    const email = this.session.user()?.email ?? "";
    return email.split("@")[0];
  }

  constructor(
    readonly store: CockpitStore,
    readonly session: SessionStore,
    private readonly api: PortalApiService
  ) {
    effect(() => {
      const id = this.store.activeTenantId();
      if (id) this.loadData(id);
    });
  }

  async ngOnInit(): Promise<void> {
    const id = this.store.activeTenantId();
    if (id) await this.loadData(id);
  }

  private async loadData(tenantId: string): Promise<void> {
    [this.overview, this.projects] = await Promise.all([
      this.api.tenantOverview(tenantId),
      this.api.tenantProjects(tenantId),
    ]);
    this.recentJobs = this.overview?.recentJobs ?? [];
    // Load CSAT for first project (non-blocking)
    if (this.projects.length) {
      this.api.satisfactionStats(tenantId, this.projects[0].projectKey)
        .then((s) => { if (s.total > 0) this.csat = s; })
        .catch(() => {});
    }
  }

  csatColor(score: number): string {
    if (score >= 4) return "var(--ck-green, #3fb950)";
    if (score >= 3) return "var(--ck-gold, #c29a52)";
    return "var(--ck-red, #f85149)";
  }

  statusBadgeClass(status?: string): string {
    switch (status) {
      case "active": return "ck-badge ck-badge--success";
      case "draft": return "ck-badge ck-badge--warning";
      case "disabled": return "ck-badge ck-badge--default";
      default: return "ck-badge ck-badge--success";
    }
  }

  ingestionBadgeClass(status: string): string {
    switch (status) {
      case "done": return "ck-badge ck-badge--success";
      case "running": return "ck-badge ck-badge--info";
      case "queued": return "ck-badge ck-badge--warning";
      case "failed": return "ck-badge ck-badge--danger";
      default: return "ck-badge ck-badge--default";
    }
  }
}
