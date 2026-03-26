import { Component, OnInit, effect } from "@angular/core";
import { RouterModule } from "@angular/router";
import { CockpitStore } from "../cockpit-store.service";
import { PortalApiService } from "../../core/portal-api.service";
import { Project } from "../../core/models";

@Component({
  selector: "app-bot-deployments",
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="ck-topbar">
      <div class="ck-topbar__breadcrumb">
        <span>Bots</span>
        <span>›</span>
        <strong>Deployments</strong>
      </div>
    </div>

    <div class="ck-content">
      <div class="ck-page-header">
        <div>
          <h1 class="ck-page-header__title">Deployments</h1>
          <p class="ck-page-header__sub">Active bot deployments and embed status</p>
        </div>
      </div>

      @if (loading) {
        <div class="ck-stats">
          @for (i of [1,2,3]; track i) {
            <div class="ck-stat"><div class="ck-skeleton ck-auto-011"></div></div>
          }
        </div>
      } @else {
        <div class="ck-stats ck-auto-053">
          <div class="ck-stat">
            <div class="ck-stat__label">Total Bots</div>
            <div class="ck-stat__value">{{ bots.length }}</div>
          </div>
          <div class="ck-stat">
            <div class="ck-stat__label">Active</div>
            <div class="ck-stat__value ck-auto-071">{{ activeCount }}</div>
          </div>
          <div class="ck-stat">
            <div class="ck-stat__label">Draft</div>
            <div class="ck-stat__value ck-auto-072">{{ draftCount }}</div>
          </div>
          <div class="ck-stat">
            <div class="ck-stat__label">Disabled</div>
            <div class="ck-stat__value ck-auto-073">{{ disabledCount }}</div>
          </div>
        </div>

        @if (bots.length > 0) {
          <div class="ck-auto-059">
            @for (bot of bots; track bot.id) {
              <div class="ck-card ck-card--compact ck-auto-074">
                <div class="ck-auto-023">
                  <div class="ck-auto-075">
                    <strong class="ck-auto-076">{{ bot.botName }}</strong>
                    <span class="ck-badge" [class]="statusBadge(bot.status)">
                      <span class="ck-dot"></span> {{ bot.status ?? 'active' }}
                    </span>
                  </div>
                  <div class="ck-auto-077">
                    <span class="ck-auto-078">{{ bot.projectKey }}</span>
                    &nbsp;·&nbsp;
                    {{ bot.allowedDomains.length }} domain(s)
                    &nbsp;·&nbsp;
                    {{ bot.language }}
                  </div>
                </div>
                <div class="ck-auto-079">
                  <a class="ck-btn ck-btn--ghost ck-btn--sm" [routerLink]="['/app/bots', bot.projectKey]">
                    Configure
                  </a>
                  <a class="ck-btn ck-btn--secondary ck-btn--sm" [routerLink]="['/app/bots', bot.projectKey]">
                    View
                  </a>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="ck-card">
            <div class="ck-empty">
              <div class="ck-empty__icon">▲</div>
              <p class="ck-empty__title">No deployments</p>
              <p class="ck-empty__sub">Create your first bot to deploy it.</p>
              <a class="ck-btn ck-btn--primary" routerLink="/app/bots/new">Create Bot</a>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class BotDeploymentsComponent implements OnInit {
  bots: Project[] = [];
  loading = true;

  get activeCount(): number { return this.bots.filter(b => (b.status ?? 'active') === 'active').length; }
  get draftCount(): number { return this.bots.filter(b => b.status === 'draft').length; }
  get disabledCount(): number { return this.bots.filter(b => b.status === 'disabled').length; }

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

  statusBadge(status?: string): string {
    switch (status) {
      case "active": return "ck-badge ck-badge--success";
      case "draft": return "ck-badge ck-badge--warning";
      case "disabled": return "ck-badge ck-badge--default";
      default: return "ck-badge ck-badge--success";
    }
  }
}
