import { Component, OnInit, effect } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { CockpitStore } from "../cockpit-store.service";
import { PortalApiService } from "../../core/portal-api.service";
import { AnalyticsTrends, Project, RagQualityStats, SatisfactionStats } from "../../core/models";

interface AnalyticsSummary {
  projectKey: string;
  events: Array<{ eventType: string; total: number }>;
  unanswered: Array<{ message: string; total: number }>;
  leads: Array<{ deliveryStatus: string; total: number }>;
}

const EVENT_LABELS: Record<string, string> = {
  widget_opened: "Widget Opened",
  message_sent: "Messages Sent",
  response_served: "Responses Served",
  citation_clicked: "Citations Clicked",
  cta_clicked: "CTA Clicks",
  lead_submitted: "Leads Submitted",
  no_answer: "No Answer",
  fallback: "Fallback Used",
};

@Component({
  selector: "app-analytics",
  standalone: true,
  imports: [RouterModule, FormsModule],
  template: `
    <div class="ck-topbar">
      <div class="ck-topbar__breadcrumb">
        <strong>Analytics</strong>
      </div>
      <div class="ck-topbar__actions">
        <button class="ck-btn ck-btn--secondary ck-btn--sm" (click)="exportOpen = !exportOpen">↓ Export</button>
      </div>
    </div>

    <!-- Export modal -->
    @if (exportOpen) {
      <div style="position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;" (click)="exportOpen = false">
        <div class="ck-card" style="width: 340px; background: var(--ck-surface-raised);" (click)="$event.stopPropagation()">
          <div class="ck-card__header">
            <p class="ck-card__title">Export Data</p>
            <button class="ck-btn ck-btn--ghost ck-btn--sm" (click)="exportOpen = false">✕</button>
          </div>
          <div style="display: grid; gap: 10px;">
            <button class="ck-btn ck-btn--secondary" (click)="exportData('conversations')" [disabled]="exporting">
              ↓ Conversations CSV
            </button>
            <button class="ck-btn ck-btn--secondary" (click)="exportData('leads')" [disabled]="exporting">
              ↓ Leads CSV
            </button>
            <button class="ck-btn ck-btn--secondary" (click)="exportData('analytics')" [disabled]="exporting">
              ↓ Analytics Events CSV
            </button>
          </div>
          @if (exportMsg) {
            <p style="margin-top: 10px; font-size: 0.82rem; color: var(--ck-text-muted);">{{ exportMsg }}</p>
          }
        </div>
      </div>
    }

    <div class="ck-content">
      <div class="ck-page-header">
        <div>
          <h1 class="ck-page-header__title">Analytics</h1>
          <p class="ck-page-header__sub">Usage metrics across your bots</p>
        </div>
        <div class="ck-page-header__actions">
          <select class="ck-select" style="min-width: 200px;" [(ngModel)]="selectedProjectKey" (ngModelChange)="onProjectChange($event)">
            @for (p of projects; track p.projectKey) {
              <option [value]="p.projectKey">{{ p.botName }} · {{ p.projectKey }}</option>
            }
          </select>
        </div>
      </div>

      <!-- Tabs -->
      <div style="display: flex; gap: 4px; margin-bottom: 20px; border-bottom: 1px solid var(--ck-border); padding-bottom: 0;">
        <button class="ck-tab" [class.is-active]="activeTab === 'usage'" (click)="activeTab = 'usage'">Usage</button>
        <button class="ck-tab" [class.is-active]="activeTab === 'satisfaction'" (click)="switchSatisfaction()">Satisfaction</button>
        <button class="ck-tab" [class.is-active]="activeTab === 'quality'" (click)="switchQuality()">Knowledge Quality</button>
        <button class="ck-tab" [class.is-active]="activeTab === 'trends'" (click)="switchTrends()">Trends</button>
      </div>

      @if (!selectedProjectKey) {
        <div class="ck-card">
          <div class="ck-empty">
            <div class="ck-empty__icon">▣</div>
            <p class="ck-empty__title">Select a bot to view analytics</p>
          </div>
        </div>
      } @else if (activeTab === 'usage') {

        @if (loading) {
          <div class="ck-stats">
            @for (i of [1,2,3,4,5,6,7,8]; track i) {
              <div class="ck-stat"><div class="ck-skeleton" style="height: 60px;"></div></div>
            }
          </div>
        } @else if (summary) {
          <!-- Event metrics -->
          <div class="ck-stats">
            @for (event of summary.events; track event.eventType) {
              <div class="ck-stat">
                <div class="ck-stat__label">{{ eventLabel(event.eventType) }}</div>
                <div class="ck-stat__value">{{ event.total }}</div>
                <div class="ck-stat__delta">{{ event.eventType }}</div>
              </div>
            }
          </div>

          <div class="ck-grid-two" style="margin-top: 24px;">
            <!-- Unanswered questions -->
            <div class="ck-card">
              <div class="ck-card__header">
                <div>
                  <p class="ck-card__title">Unanswered Questions</p>
                  <p class="ck-card__sub">Topics your bot couldn't answer</p>
                </div>
                <span class="ck-badge ck-badge--danger">{{ summary.unanswered.length }} topics</span>
              </div>
              @if (summary.unanswered.length > 0) {
                <div class="ck-table-wrap">
                  <table class="ck-table">
                    <thead>
                      <tr>
                        <th>Question</th>
                        <th>Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of summary.unanswered.slice(0, 10); track item.message) {
                        <tr>
                          <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" [title]="item.message">
                            {{ item.message }}
                          </td>
                          <td>
                            <span class="ck-badge ck-badge--warning">{{ item.total }}</span>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              } @else {
                <div class="ck-empty" style="padding: 24px;">
                  <p class="ck-empty__title">No unanswered questions</p>
                  <p class="ck-empty__sub">Your bot is answering everything!</p>
                </div>
              }
            </div>

            <!-- Lead delivery status -->
            <div class="ck-card">
              <div class="ck-card__header">
                <div>
                  <p class="ck-card__title">Lead Delivery</p>
                  <p class="ck-card__sub">Webhook delivery status breakdown</p>
                </div>
              </div>
              @if (summary.leads.length > 0) {
                <div style="display: grid; gap: 10px;">
                  @for (lead of summary.leads; track lead.deliveryStatus) {
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--ck-border);">
                      <span class="ck-badge" [class]="leadBadge(lead.deliveryStatus)">
                        <span class="ck-dot"></span>
                        {{ lead.deliveryStatus }}
                      </span>
                      <strong style="font-size: 1.1rem; font-weight: 700;">{{ lead.total }}</strong>
                    </div>
                  }
                </div>
              } @else {
                <div class="ck-empty" style="padding: 24px;">
                  <p class="ck-empty__title">No leads yet</p>
                  <p class="ck-empty__sub">Lead submissions will appear here.</p>
                </div>
              }

              <div class="ck-divider"></div>

              <div style="background: var(--ck-accent-soft); border-radius: var(--ck-radius); padding: 12px;">
                <p style="font-size: 0.78rem; color: var(--ck-accent-strong); margin: 0; line-height: 1.5;">
                  <strong>Pro tip:</strong> Configure a webhook URL in your bot settings to receive leads in real time.
                </p>
              </div>
            </div>
          </div>
        }

      } @else if (activeTab === 'satisfaction') {

        @if (csatLoading) {
          <div class="ck-stats">
            @for (i of [1,2,3]; track i) {
              <div class="ck-stat"><div class="ck-skeleton" style="height: 80px;"></div></div>
            }
          </div>
        } @else if (csat) {
          <!-- Score overview -->
          <div class="ck-stats" style="margin-bottom: 24px;">
            <div class="ck-stat">
              <div class="ck-stat__label">Average Score</div>
              <div class="ck-stat__value" [style.color]="csatColor(csat.avg)">{{ csat.avg.toFixed(1) }} ★</div>
              <div class="ck-stat__delta">out of 5.0</div>
            </div>
            <div class="ck-stat">
              <div class="ck-stat__label">Total Ratings</div>
              <div class="ck-stat__value">{{ csat.total }}</div>
              <div class="ck-stat__delta">conversations rated</div>
            </div>
            <div class="ck-stat">
              <div class="ck-stat__label">Satisfaction Rate</div>
              <div class="ck-stat__value" [style.color]="csatColor(csat.avg)">
                {{ csat.total ? ((((csat.distribution['4'] ?? 0) + (csat.distribution['5'] ?? 0)) / csat.total) * 100).toFixed(0) + '%' : '—' }}
              </div>
              <div class="ck-stat__delta">scored 4 or 5 stars</div>
            </div>
          </div>

          <div class="ck-grid-two">
            <!-- Distribution bars -->
            <div class="ck-card">
              <div class="ck-card__header">
                <p class="ck-card__title">Score Distribution</p>
              </div>
              <div style="display: grid; gap: 10px;">
                @for (star of [5,4,3,2,1]; track star) {
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 0.82rem; width: 42px; color: var(--ck-text-soft);">{{ star }} ★</span>
                    <div style="flex: 1; background: var(--ck-surface-high); border-radius: 4px; height: 10px; overflow: hidden;">
                      <div [style.width]="barWidth(star)" [style.background]="csatColor(star)" style="height: 100%; border-radius: 4px; transition: width 0.4s;"></div>
                    </div>
                    <span style="font-size: 0.78rem; color: var(--ck-text-muted); width: 32px; text-align: right;">{{ csat.distribution[star] ?? 0 }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Recent comments -->
            <div class="ck-card">
              <div class="ck-card__header">
                <p class="ck-card__title">Recent Comments</p>
              </div>
              @if (csat.recentComments.length > 0) {
                <div style="display: grid; gap: 12px;">
                  @for (c of csat.recentComments.slice(0, 6); track c.date) {
                    <div style="padding: 10px; background: var(--ck-surface-high); border-radius: var(--ck-radius-sm);">
                      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <span style="font-size: 0.84rem;" [style.color]="csatColor(c.score)">{{ '★'.repeat(c.score) }}{{ '☆'.repeat(5 - c.score) }}</span>
                        <span style="font-size: 0.72rem; color: var(--ck-text-muted);">{{ c.date | slice:0:10 }}</span>
                      </div>
                      <p style="margin: 0; font-size: 0.82rem; color: var(--ck-text-soft); line-height: 1.5;">{{ c.comment }}</p>
                    </div>
                  }
                </div>
              } @else {
                <div class="ck-empty" style="padding: 24px;">
                  <p class="ck-empty__title">No comments yet</p>
                  <p class="ck-empty__sub">Users can leave comments when rating conversations.</p>
                </div>
              }
            </div>
          </div>
        } @else {
          <div class="ck-card">
            <div class="ck-empty">
              <div class="ck-empty__icon">★</div>
              <p class="ck-empty__title">No satisfaction data yet</p>
              <p class="ck-empty__sub">Ratings appear when users score conversations via the widget.</p>
            </div>
          </div>
        }

      } @else if (activeTab === 'quality') {

        <!-- Period selector -->
        <div style="display: flex; gap: 8px; margin-bottom: 20px;">
          @for (p of ['7d', '30d', '90d']; track p) {
            <button class="ck-btn ck-btn--ghost ck-btn--sm"
                    [class.ck-btn--secondary]="ragPeriod === p"
                    (click)="switchRagPeriod(p)">{{ p }}</button>
          }
        </div>

        @if (ragLoading) {
          <div class="ck-stats">
            @for (i of [1,2,3,4]; track i) {
              <div class="ck-stat"><div class="ck-skeleton" style="height: 80px;"></div></div>
            }
          </div>
        } @else if (rag) {
          <div class="ck-stats" style="margin-bottom: 24px;">
            <div class="ck-stat">
              <div class="ck-stat__label">Coverage Score</div>
              <div class="ck-stat__value" [style.color]="coverageColor(rag.coverageScore)">
                {{ rag.coverageScore != null ? rag.coverageScore + '%' : '—' }}
              </div>
              <div class="ck-stat__delta">% answered</div>
            </div>
            <div class="ck-stat">
              <div class="ck-stat__label">Fallback Rate</div>
              <div class="ck-stat__value" [style.color]="fallbackColor(rag.fallbackRate)">{{ rag.fallbackRate }}%</div>
              <div class="ck-stat__delta">of {{ rag.totalMessages }} messages</div>
            </div>
            <div class="ck-stat">
              <div class="ck-stat__label">Avg Confidence</div>
              <div class="ck-stat__value">{{ rag.avgConfidence != null ? rag.avgConfidence.toFixed(2) : '—' }}</div>
              <div class="ck-stat__delta">0–1 scale</div>
            </div>
            <div class="ck-stat">
              <div class="ck-stat__label">Low Confidence</div>
              <div class="ck-stat__value" [style.color]="rag.lowConfidenceCount > 0 ? 'var(--ck-red)' : 'inherit'">{{ rag.lowConfidenceCount }}</div>
              <div class="ck-stat__delta">responses below 0.3</div>
            </div>
          </div>

          <div class="ck-card">
            <div class="ck-card__header">
              <div>
                <p class="ck-card__title">Knowledge Gaps</p>
                <p class="ck-card__sub">Unanswered questions — consider adding these to your knowledge base</p>
              </div>
              <span class="ck-badge ck-badge--danger">{{ rag.topGaps.length }} topics</span>
            </div>
            @if (rag.topGaps.length > 0) {
              <div class="ck-table-wrap">
                <table class="ck-table">
                  <thead><tr><th>Question</th><th>Times Asked</th></tr></thead>
                  <tbody>
                    @for (gap of rag.topGaps; track gap.question) {
                      <tr>
                        <td style="font-size: 0.84rem;">{{ gap.question }}</td>
                        <td><span class="ck-badge ck-badge--warning">{{ gap.count }}</span></td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            } @else {
              <div class="ck-empty" style="padding: 24px;">
                <p class="ck-empty__title">No knowledge gaps detected</p>
                <p class="ck-empty__sub">Your bot is covering all questions in the selected period.</p>
              </div>
            }
          </div>
        } @else {
          <div class="ck-card">
            <div class="ck-empty">
              <div class="ck-empty__icon">◈</div>
              <p class="ck-empty__title">No quality data yet</p>
              <p class="ck-empty__sub">Metrics appear once your bot has handled conversations.</p>
            </div>
          </div>
        }

      } @else if (activeTab === 'trends') {

        <!-- Period selector -->
        <div style="display: flex; gap: 8px; margin-bottom: 20px;">
          @for (p of ['7d', '30d', '90d']; track p) {
            <button class="ck-btn ck-btn--ghost ck-btn--sm"
                    [class.ck-btn--secondary]="trendsPeriod === p"
                    (click)="switchTrendsPeriod(p)">{{ p }}</button>
          }
        </div>

        @if (trendsLoading) {
          <div class="ck-stats">
            @for (i of [1,2,3,4]; track i) {
              <div class="ck-stat"><div class="ck-skeleton" style="height: 80px;"></div></div>
            }
          </div>
        } @else if (trends) {
          <!-- KPI cards -->
          <div class="ck-stats" style="margin-bottom: 24px;">
            <div class="ck-stat">
              <div class="ck-stat__label">Resolution Rate</div>
              <div class="ck-stat__value" [style.color]="coverageColor(trends.resolutionRate)">
                {{ trends.resolutionRate != null ? trends.resolutionRate + '%' : '—' }}
              </div>
              <div class="ck-stat__delta">conversations resolved</div>
            </div>
            <div class="ck-stat">
              <div class="ck-stat__label">Handover Rate</div>
              <div class="ck-stat__value" [style.color]="trends.handoverRate != null && trends.handoverRate > 20 ? 'var(--ck-gold)' : 'inherit'">
                {{ trends.handoverRate != null ? trends.handoverRate + '%' : '—' }}
              </div>
              <div class="ck-stat__delta">escalated to agent</div>
            </div>
            <div class="ck-stat">
              <div class="ck-stat__label">Avg Messages / Conv</div>
              <div class="ck-stat__value">{{ trends.avgMessagesPerConversation != null ? trends.avgMessagesPerConversation.toFixed(1) : '—' }}</div>
              <div class="ck-stat__delta">messages per session</div>
            </div>
            <div class="ck-stat">
              <div class="ck-stat__label">Avg Duration</div>
              <div class="ck-stat__value">{{ trends.avgConversationDurationMinutes != null ? trends.avgConversationDurationMinutes.toFixed(1) + ' min' : '—' }}</div>
              <div class="ck-stat__delta">average session length</div>
            </div>
          </div>

          <!-- Daily sparkline chart -->
          @if (trends.dailySeries.length > 0) {
            <div class="ck-card">
              <div class="ck-card__header">
                <div>
                  <p class="ck-card__title">Daily Activity</p>
                  <p class="ck-card__sub">Messages per day in the selected period</p>
                </div>
              </div>
              <div style="overflow-x: auto; padding: 8px 0;">
                <svg [attr.width]="sparklineWidth()" height="80" style="display: block; min-width: 100%;">
                  <!-- Y-axis baseline -->
                  <line x1="0" [attr.x2]="sparklineWidth()" y1="75" y2="75"
                        stroke="var(--ck-border)" stroke-width="1"/>
                  <!-- Bars -->
                  @for (d of trends.dailySeries; track d.date; let i = $index) {
                    <rect
                      [attr.x]="sparklineX(i)"
                      [attr.y]="sparklineY(d.messages)"
                      [attr.width]="sparklineBarW()"
                      [attr.height]="sparklineH(d.messages)"
                      [attr.fill]="sparklineFill(i)"
                      rx="2"
                    />
                    <!-- Date label every N days -->
                    @if (shouldShowLabel(i)) {
                      <text
                        [attr.x]="sparklineX(i) + sparklineBarW() / 2"
                        y="76"
                        text-anchor="middle"
                        font-size="9"
                        fill="var(--ck-text-muted)"
                        dominant-baseline="hanging"
                      >{{ d.date | slice:5:10 }}</text>
                    }
                  }
                </svg>
              </div>

              <!-- Legend -->
              <div style="display: flex; gap: 20px; margin-top: 12px; font-size: 0.78rem; color: var(--ck-text-soft);">
                <span style="display: flex; align-items: center; gap: 6px;">
                  <span style="width: 12px; height: 12px; background: var(--ck-accent, #00c2a8); border-radius: 2px; display: inline-block;"></span>
                  Messages
                </span>
              </div>
            </div>
          } @else {
            <div class="ck-card">
              <div class="ck-empty" style="padding: 24px;">
                <p class="ck-empty__title">No data in this period</p>
                <p class="ck-empty__sub">Trend data will appear as your bot handles conversations.</p>
              </div>
            </div>
          }
        } @else {
          <div class="ck-card">
            <div class="ck-empty">
              <div class="ck-empty__icon">↗</div>
              <p class="ck-empty__title">No trends data yet</p>
              <p class="ck-empty__sub">Metrics appear once your bot has handled conversations.</p>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class AnalyticsComponent implements OnInit {
  projects: Project[] = [];
  selectedProjectKey = "";
  summary: AnalyticsSummary | null = null;
  loading = false;
  activeTab: "usage" | "satisfaction" | "quality" | "trends" = "usage";
  csat: SatisfactionStats | null = null;
  csatLoading = false;
  rag: RagQualityStats | null = null;
  ragLoading = false;
  ragPeriod = "30d";
  trends: AnalyticsTrends | null = null;
  trendsLoading = false;
  trendsPeriod = "30d";
  exportOpen = false;
  exporting = false;
  exportMsg = "";

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
    if (this.projects.length) {
      this.selectedProjectKey = this.projects[0].projectKey;
      await this.loadAnalytics(this.selectedProjectKey);
    }
  }

  onProjectChange(projectKey: string): void {
    this.csat = null;
    this.rag = null;
    this.trends = null;
    this.loadAnalytics(projectKey);
    if (this.activeTab === "satisfaction") this.loadCsat(projectKey);
    if (this.activeTab === "quality") this.loadRag(projectKey, this.ragPeriod);
    if (this.activeTab === "trends") this.loadTrends(projectKey, this.trendsPeriod);
  }

  async loadAnalytics(projectKey: string): Promise<void> {
    const tenantId = this.store.activeTenantId();
    if (!tenantId || !projectKey) return;
    this.loading = true;
    try {
      this.summary = await this.api.tenantAnalytics(tenantId, projectKey);
    } finally {
      this.loading = false;
    }
  }

  async switchSatisfaction(): Promise<void> {
    this.activeTab = "satisfaction";
    if (!this.csat && this.selectedProjectKey) await this.loadCsat(this.selectedProjectKey);
  }

  async switchQuality(): Promise<void> {
    this.activeTab = "quality";
    if (!this.rag && this.selectedProjectKey) await this.loadRag(this.selectedProjectKey, this.ragPeriod);
  }

  async switchTrends(): Promise<void> {
    this.activeTab = "trends";
    if (!this.trends && this.selectedProjectKey) await this.loadTrends(this.selectedProjectKey, this.trendsPeriod);
  }

  async switchRagPeriod(period: string): Promise<void> {
    this.ragPeriod = period;
    this.rag = null;
    if (this.selectedProjectKey) await this.loadRag(this.selectedProjectKey, period);
  }

  async switchTrendsPeriod(period: string): Promise<void> {
    this.trendsPeriod = period;
    this.trends = null;
    if (this.selectedProjectKey) await this.loadTrends(this.selectedProjectKey, period);
  }

  private async loadRag(projectKey: string, period: string): Promise<void> {
    const tenantId = this.store.activeTenantId();
    if (!tenantId) return;
    this.ragLoading = true;
    try {
      this.rag = await this.api.ragQuality(tenantId, projectKey, period);
    } finally {
      this.ragLoading = false;
    }
  }

  private async loadCsat(projectKey: string): Promise<void> {
    const tenantId = this.store.activeTenantId();
    if (!tenantId) return;
    this.csatLoading = true;
    try {
      this.csat = await this.api.satisfactionStats(tenantId, projectKey);
    } finally {
      this.csatLoading = false;
    }
  }

  private async loadTrends(projectKey: string, period: string): Promise<void> {
    const tenantId = this.store.activeTenantId();
    if (!tenantId) return;
    this.trendsLoading = true;
    try {
      this.trends = await this.api.analyticsTrends(tenantId, projectKey, period);
    } finally {
      this.trendsLoading = false;
    }
  }

  async exportData(type: "conversations" | "leads" | "analytics"): Promise<void> {
    const tenantId = this.store.activeTenantId();
    if (!tenantId) return;
    this.exporting = true;
    this.exportMsg = "Preparing download…";
    try {
      let blob: Blob;
      if (type === "conversations") blob = await this.api.exportConversations(tenantId);
      else if (type === "leads") blob = await this.api.exportLeads(tenantId);
      else blob = await this.api.exportAnalytics(tenantId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      this.exportMsg = "Download started.";
    } catch {
      this.exportMsg = "Export failed. Try again.";
    } finally {
      this.exporting = false;
    }
  }

  // Sparkline helpers
  sparklineWidth(): number {
    return Math.max(400, (this.trends?.dailySeries.length ?? 0) * 20);
  }

  sparklineBarW(): number {
    return 14;
  }

  sparklineX(i: number): number {
    return i * 20 + 3;
  }

  sparklineMaxMessages(): number {
    const series = this.trends?.dailySeries ?? [];
    return Math.max(1, ...series.map(d => d.messages));
  }

  sparklineY(messages: number): number {
    return 10 + (1 - messages / this.sparklineMaxMessages()) * 55;
  }

  sparklineH(messages: number): number {
    return Math.max(2, (messages / this.sparklineMaxMessages()) * 55);
  }

  sparklineFill(i: number): string {
    return i % 2 === 0 ? "var(--ck-accent, #00c2a8)" : "var(--ck-accent-soft, rgba(0,194,168,0.6))";
  }

  shouldShowLabel(i: number): boolean {
    const len = this.trends?.dailySeries.length ?? 0;
    if (len <= 7) return true;
    if (len <= 31) return i % 5 === 0;
    return i % 10 === 0;
  }

  barWidth(star: number): string {
    if (!this.csat || !this.csat.total) return "0%";
    return `${Math.round(((this.csat.distribution[star] ?? 0) / this.csat.total) * 100)}%`;
  }

  csatColor(score: number): string {
    if (score >= 4) return "var(--ck-green, #3fb950)";
    if (score >= 3) return "var(--ck-gold, #c29a52)";
    return "var(--ck-red, #f85149)";
  }

  eventLabel(type: string): string {
    return EVENT_LABELS[type] ?? type;
  }

  coverageColor(score: number | null): string {
    if (score == null) return "inherit";
    if (score >= 85) return "var(--ck-green, #3fb950)";
    if (score >= 60) return "var(--ck-gold, #c29a52)";
    return "var(--ck-red, #f85149)";
  }

  fallbackColor(rate: number): string {
    if (rate <= 10) return "var(--ck-green, #3fb950)";
    if (rate <= 25) return "var(--ck-gold, #c29a52)";
    return "var(--ck-red, #f85149)";
  }

  leadBadge(status: string): string {
    switch (status) {
      case "delivered": return "ck-badge ck-badge--success";
      case "failed": return "ck-badge ck-badge--danger";
      case "pending": return "ck-badge ck-badge--warning";
      default: return "ck-badge ck-badge--default";
    }
  }
}
