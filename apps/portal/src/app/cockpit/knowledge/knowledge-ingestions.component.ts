import { Component, OnInit, effect } from "@angular/core";
import { RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { CockpitStore } from "../cockpit-store.service";
import { PortalApiService } from "../../core/portal-api.service";
import { IngestionItem, Project } from "../../core/models";

@Component({
  selector: "app-knowledge-ingestions",
  standalone: true,
  imports: [RouterModule, FormsModule],
  template: `
    <div class="ck-content">
      <div class="ck-page-header">
        <div>
          <h1 class="ck-page-header__title">Ingestion Jobs</h1>
          <p class="ck-page-header__sub">Knowledge sync history and queue status</p>
        </div>
        <div class="ck-page-header__actions">
          <button class="ck-btn ck-btn--secondary ck-btn--sm" (click)="refresh()">↻ Refresh</button>
        </div>
      </div>

      <div class="ck-grid-sidebar">
        <!-- Jobs table -->
        <div>
          <div class="ck-toolbar">
            <select class="ck-select ck-auto-035" [(ngModel)]="filterStatus">
              <option value="">All status</option>
              <option value="queued">Queued</option>
              <option value="running">Running</option>
              <option value="done">Done</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          @if (loading) {
            <div class="ck-card">
              @for (i of [1,2,3,4]; track i) {
                <div class="ck-skeleton ck-auto-031"></div>
              }
            </div>
          } @else if (filtered.length > 0) {
            <div class="ck-table-wrap">
              <table class="ck-table">
                <thead>
                  <tr>
                    <th>Job</th>
                    <th>Bot / Source</th>
                    <th>Status</th>
                    <th>Requested by</th>
                    <th>Started</th>
                  </tr>
                </thead>
                <tbody>
                  @for (job of filtered; track job.id) {
                    <tr>
                      <td class="ck-table__cell--mono ck-auto-147">{{ job.id.slice(0, 8) }}…</td>
                      <td>
                        <div class="ck-table__cell--strong">{{ job.projectKey }}</div>
                        <div class="ck-auto-009">{{ job.sourceKey }}</div>
                      </td>
                      <td>
                        <span class="ck-badge" [class]="statusBadge(job.status)">
                          @if (job.status === 'running') {
                            <span class="ck-auto-161">↻</span>
                          } @else {
                            <span class="ck-dot"></span>
                          }
                          {{ job.status }}
                        </span>
                      </td>
                      <td class="ck-auto-010">{{ job.requestedBy }}</td>
                      <td class="ck-auto-010">
                        {{ job.createdAt | date: 'MMM d, HH:mm' }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <div class="ck-card">
              <div class="ck-empty">
                <div class="ck-empty__icon">↻</div>
                <p class="ck-empty__title">No jobs found</p>
                <p class="ck-empty__sub">Queue an ingestion job to sync your knowledge sources.</p>
              </div>
            </div>
          }
        </div>

        <!-- Queue new job -->
        <div class="ck-card">
          <div class="ck-card__header">
            <p class="ck-card__title">Queue Ingestion</p>
          </div>
          @if (queueSuccess) {
            <div class="ck-alert ck-alert--success ck-auto-033">Job queued successfully.</div>
          }
          <div class="ck-form-stack">
            <div class="ck-field">
              <label class="ck-label">Bot</label>
              <select class="ck-select" [(ngModel)]="queueForm.projectKey">
                @for (p of projects; track p.projectKey) {
                  <option [value]="p.projectKey">{{ p.botName }} ({{ p.projectKey }})</option>
                }
              </select>
            </div>
            <div class="ck-field">
              <label class="ck-label">Source Key</label>
              <input class="ck-input" [(ngModel)]="queueForm.sourceKey" placeholder="public-web" />
            </div>
            <button class="ck-btn ck-btn--primary ck-auto-034" (click)="queue()" [disabled]="queuing">
              {{ queuing ? 'Queuing…' : '↻ Queue Job' }}
            </button>
          </div>

          <div class="ck-divider"></div>

          <div class="ck-auto-162">
            <div class="ck-auto-163">
              <span class="ck-auto-164">Running</span>
              <span class="ck-badge ck-badge--info">{{ countByStatus('running') }}</span>
            </div>
            <div class="ck-auto-163">
              <span class="ck-auto-164">Queued</span>
              <span class="ck-badge ck-badge--warning">{{ countByStatus('queued') }}</span>
            </div>
            <div class="ck-auto-163">
              <span class="ck-auto-164">Done</span>
              <span class="ck-badge ck-badge--success">{{ countByStatus('done') }}</span>
            </div>
            <div class="ck-auto-163">
              <span class="ck-auto-164">Failed</span>
              <span class="ck-badge ck-badge--danger">{{ countByStatus('failed') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `})
export class KnowledgeIngestionComponent implements OnInit {
  jobs: IngestionItem[] = [];
  projects: Project[] = [];
  loading = true;
  queuing = false;
  queueSuccess = false;
  filterStatus = "";

  queueForm = {
    projectKey: "",
    sourceKey: "public-web",
  };

  get filtered(): IngestionItem[] {
    return this.jobs.filter((j) => !this.filterStatus || j.status === this.filterStatus);
  }

  countByStatus(status: string): number {
    return this.jobs.filter((j) => j.status === status).length;
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
      [this.jobs, this.projects] = await Promise.all([
        this.api.tenantIngestions(tenantId),
        this.api.tenantProjects(tenantId),
      ]);
      if (this.projects.length && !this.queueForm.projectKey) {
        this.queueForm.projectKey = this.projects[0].projectKey;
      }
    } finally {
      this.loading = false;
    }
  }

  async queue(): Promise<void> {
    const tenantId = this.store.activeTenantId();
    if (!tenantId) return;
    this.queuing = true;
    try {
      await this.api.queueIngestion(tenantId, { ...this.queueForm });
      this.queueSuccess = true;
      await this.load(tenantId);
      setTimeout(() => (this.queueSuccess = false), 3000);
    } finally {
      this.queuing = false;
    }
  }

  async refresh(): Promise<void> {
    const id = this.store.activeTenantId();
    if (id) await this.load(id);
  }

  statusBadge(status: string): string {
    switch (status) {
      case "done": return "ck-badge ck-badge--success";
      case "running": return "ck-badge ck-badge--info";
      case "queued": return "ck-badge ck-badge--warning";
      case "failed": return "ck-badge ck-badge--danger";
      default: return "ck-badge ck-badge--default";
    }
  }
}
