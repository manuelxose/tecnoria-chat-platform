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
    <!-- Export modal -->
    @if (exportOpen) {
      <div class="ck-auto-040" (click)="exportOpen = false">
        <div class="ck-card ck-auto-041" (click)="$event.stopPropagation()">
          <div class="ck-card__header">
            <p class="ck-card__title">Export Data</p>
            <button class="ck-btn ck-btn--ghost ck-btn--sm" (click)="exportOpen = false">✕</button>
          </div>
          <div class="ck-auto-021">
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
            <p class="ck-auto-042">{{ exportMsg }}</p>
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
          <button class="ck-btn ck-btn--secondary ck-btn--sm" (click)="exportOpen = !exportOpen">↓ Export</button>
          <select class="ck-select ck-auto-043" [(ngModel)]="selectedProjectKey" (ngModelChange)="onProjectChange($event)">
            @for (p of projects; track p.projectKey) {
              <option [value]="p.projectKey">{{ p.botName }} · {{ p.projectKey }}</option>
            }
          </select>
        </div>
      </div>

      <!-- Tabs -->
      <div class="ck-auto-044">
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
              <div class="ck-stat"><div class="ck-skeleton ck-auto-011"></div></div>
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

          <div class="ck-grid-two ck-auto-045">
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
                          <td class="ck-auto-046" [title]="item.message">
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
                <div class="ck-empty ck-auto-047">
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
                <div class="ck-auto-021">
                  @for (lead of summary.leads; track lead.deliveryStatus) {
                    <div class="ck-auto-048">
                      <span class="ck-badge" [class]="leadBadge(lead.deliveryStatus)">
                        <span class="ck-dot"></span>
                        {{ lead.deliveryStatus }}
                      </span>
                      <strong class="ck-auto-049">{{ lead.total }}</strong>
                    </div>
                  }
                </div>
              } @else {
                <div class="ck-empty ck-auto-047">
                  <p class="ck-empty__title">No leads yet</p>
                  <p class="ck-empty__sub">Lead submissions will appear here.</p>
                </div>
              }

              <div class="ck-divider"></div>

              <div class="ck-auto-050">
                <p class="ck-auto-051">
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
              <div class="ck-stat"><div class="ck-skeleton ck-auto-052"></div></div>
            }
          </div>
        } @else if (csat) {
          <!-- Score overview -->
          <div class="ck-stats ck-auto-053">
            <div class="ck-stat">
              <div class="ck-stat__label">Average Score</div>
              <div
                class="ck-stat__value"
                [class.ck-score--success]="csat.avg >= 4"
                [class.ck-score--warning]="csat.avg >= 3 && csat.avg < 4"
                [class.ck-score--danger]="csat.avg < 3"
              >{{ csat.avg.toFixed(1) }} ★</div>
              <div class="ck-stat__delta">out of 5.0</div>
            </div>
            <div class="ck-stat">
              <div class="ck-stat__label">Total Ratings</div>
              <div class="ck-stat__value">{{ csat.total }}</div>
              <div class="ck-stat__delta">conversations rated</div>
            </div>
            <div class="ck-stat">
              <div class="ck-stat__label">Satisfaction Rate</div>
              <div
                class="ck-stat__value"
                [class.ck-score--success]="csat.avg >= 4"
                [class.ck-score--warning]="csat.avg >= 3 && csat.avg < 4"
                [class.ck-score--danger]="csat.avg < 3"
              >
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
              <div class="ck-auto-021">
                @for (star of [5,4,3,2,1]; track star) {
                  <div class="ck-auto-054">
                    <span class="ck-auto-055">{{ star }} ★</span>
                    <div class="ck-auto-056">
                      <progress class="ck-progress ck-auto-057" [value]="barValue(star)" max="100"></progress>
                    </div>
                    <span class="ck-auto-058">{{ csat.distribution[star] ?? 0 }}</span>
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
                <div class="ck-auto-059">
                  @for (c of csat.recentComments.slice(0, 6); track c.date) {
                    <div class="ck-auto-060">
                      <div class="ck-auto-061">
                        <span
                          class="ck-auto-062"
                          [class.ck-score--success]="c.score >= 4"
                          [class.ck-score--warning]="c.score === 3"
                          [class.ck-score--danger]="c.score <= 2"
                        >{{ '★'.repeat(c.score) }}{{ '☆'.repeat(5 - c.score) }}</span>
                        <span class="ck-auto-063">{{ c.date | slice:0:10 }}</span>
                      </div>
                      <p class="ck-auto-064">{{ c.comment }}</p>
                    </div>
                  }
                </div>
              } @else {
                <div class="ck-empty ck-auto-047">
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
        <div class="ck-auto-065">
          @for (p of ['7d', '30d', '90d']; track p) {
            <button class="ck-btn ck-btn--ghost ck-btn--sm"
                    [class.ck-btn--secondary]="ragPeriod === p"
                    (click)="switchRagPeriod(p)">{{ p }}</button>
          }
        </div>

        @if (ragLoading) {
          <div class="ck-stats">
            @for (i of [1,2,3,4]; track i) {
              <div class="ck-stat"><div class="ck-skeleton ck-auto-052"></div></div>
            }
          </div>
        } @else if (rag) {
          <div class="ck-stats ck-auto-053">
            <div class="ck-stat">
              <div class="ck-stat__label">Coverage Score</div>
              <div
                class="ck-stat__value"
                [class.ck-score--success]="rag.coverageScore != null && rag.coverageScore >= 85"
                [class.ck-score--warning]="rag.coverageScore != null && rag.coverageScore >= 60 && rag.coverageScore < 85"
                [class.ck-score--danger]="rag.coverageScore != null && rag.coverageScore < 60"
              >
                {{ rag.coverageScore != null ? rag.coverageScore + '%' : '—' }}
              </div>
              <div class="ck-stat__delta">% answered</div>
            </div>
            <div class="ck-stat">
              <div class="ck-stat__label">Fallback Rate</div>
              <div
                class="ck-stat__value"
                [class.ck-score--success]="rag.fallbackRate <= 10"
                [class.ck-score--warning]="rag.fallbackRate > 10 && rag.fallbackRate <= 25"
                [class.ck-score--danger]="rag.fallbackRate > 25"
              >{{ rag.fallbackRate }}%</div>
              <div class="ck-stat__delta">of {{ rag.totalMessages }} messages</div>
            </div>
            <div class="ck-stat">
              <div class="ck-stat__label">Avg Confidence</div>
              <div class="ck-stat__value">{{ rag.avgConfidence != null ? rag.avgConfidence.toFixed(2) : '—' }}</div>
              <div class="ck-stat__delta">0–1 scale</div>
            </div>
            <div class="ck-stat">
              <div class="ck-stat__label">Low Confidence</div>
              <div class="ck-stat__value" [class.ck-score--danger]="rag.lowConfidenceCount > 0">{{ rag.lowConfidenceCount }}</div>
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
                        <td class="ck-auto-062">{{ gap.question }}</td>
                        <td><span class="ck-badge ck-badge--warning">{{ gap.count }}</span></td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            } @else {
              <div class="ck-empty ck-auto-047">
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
        <div class="ck-auto-065">
          @for (p of ['7d', '30d', '90d']; track p) {
            <button class="ck-btn ck-btn--ghost ck-btn--sm"
                    [class.ck-btn--secondary]="trendsPeriod === p"
                    (click)="switchTrendsPeriod(p)">{{ p }}</button>
          }
        </div>

        @if (trendsLoading) {
          <div class="ck-stats">
            @for (i of [1,2,3,4]; track i) {
              <div class="ck-stat"><div class="ck-skeleton ck-auto-052"></div></div>
            }
          </div>
        } @else if (trends) {
          <!-- KPI cards -->
          <div class="ck-stats ck-auto-053">
            <div class="ck-stat">
              <div class="ck-stat__label">Resolution Rate</div>
              <div
                class="ck-stat__value"
                [class.ck-score--success]="trends.resolutionRate != null && trends.resolutionRate >= 85"
                [class.ck-score--warning]="trends.resolutionRate != null && trends.resolutionRate >= 60 && trends.resolutionRate < 85"
                [class.ck-score--danger]="trends.resolutionRate != null && trends.resolutionRate < 60"
              >
                {{ trends.resolutionRate != null ? trends.resolutionRate + '%' : '—' }}
              </div>
              <div class="ck-stat__delta">conversations resolved</div>
            </div>
            <div class="ck-stat">
              <div class="ck-stat__label">Handover Rate</div>
              <div
                class="ck-stat__value"
                [class.ck-score--warning]="trends.handoverRate != null && trends.handoverRate > 20"
              >
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
              <div class="ck-auto-066">
                <svg [attr.width]="sparklineWidth()" height="80" class="ck-auto-067">
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
              <div class="ck-auto-068">
                <span class="ck-auto-069">
                  <span class="ck-auto-070"></span>
                  Messages
                </span>
              </div>
            </div>
          } @else {
            <div class="ck-card">
              <div class="ck-empty ck-auto-047">
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
    return i % 2 === 0 ? "var(--ck-accent, #8b5cf6)" : "var(--ck-accent-soft, rgba(139,92,246,0.6))";
  }

  shouldShowLabel(i: number): boolean {
    const len = this.trends?.dailySeries.length ?? 0;
    if (len <= 7) return true;
    if (len <= 31) return i % 5 === 0;
    return i % 10 === 0;
  }

  barValue(star: number): number {
    if (!this.csat || !this.csat.total) return 0;
    return Math.round(((this.csat.distribution[star] ?? 0) / this.csat.total) * 100);
  }

  barWidth(star: number): string {
    if (!this.csat || !this.csat.total) return "0%";
    return `${Math.round(((this.csat.distribution[star] ?? 0) / this.csat.total) * 100)}%`;
  }

  csatColor(score: number): string {
    if (score >= 4) return "var(--ck-success, #10b981)";
    if (score >= 3) return "var(--ck-accent, #8b5cf6)";
    return "var(--ck-danger, #ef4444)";
  }

  eventLabel(type: string): string {
    return EVENT_LABELS[type] ?? type;
  }

  coverageColor(score: number | null): string {
    if (score == null) return "inherit";
    if (score >= 85) return "var(--ck-success, #10b981)";
    if (score >= 60) return "var(--ck-accent, #8b5cf6)";
    return "var(--ck-danger, #ef4444)";
  }

  fallbackColor(rate: number): string {
    if (rate <= 10) return "var(--ck-success, #10b981)";
    if (rate <= 25) return "var(--ck-accent, #8b5cf6)";
    return "var(--ck-danger, #ef4444)";
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
