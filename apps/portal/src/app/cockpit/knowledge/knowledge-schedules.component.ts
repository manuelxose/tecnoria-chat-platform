import { Component, OnInit, effect } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { CockpitStore } from "../cockpit-store.service";
import { PortalApiService } from "../../core/portal-api.service";
import { IngestionSchedule, SourceItem } from "../../core/models";

@Component({
  selector: "app-knowledge-schedules",
  standalone: true,
  imports: [RouterModule, FormsModule],
  template: `
    <div class="ck-topbar">
      <div class="ck-topbar__breadcrumb">
        <span>Knowledge</span>
        <span>›</span>
        <strong>Schedules</strong>
      </div>
      <div class="ck-topbar__actions">
        <a class="ck-btn ck-btn--secondary ck-btn--sm" routerLink="/app/knowledge">Sources</a>
        <a class="ck-btn ck-btn--secondary ck-btn--sm" routerLink="/app/knowledge/ingestions">Jobs</a>
      </div>
    </div>

    <div class="ck-content">
      <div class="ck-page-header">
        <div>
          <h1 class="ck-page-header__title">Ingestion Schedules</h1>
          <p class="ck-page-header__sub">Automatically re-crawl knowledge sources on a schedule</p>
        </div>
        <button class="ck-btn ck-btn--primary ck-btn--sm" (click)="createOpen = !createOpen">+ New Schedule</button>
      </div>

      @if (createOpen) {
        <div class="ck-card" style="margin-bottom: 20px;">
          <p class="ck-card__title" style="margin-bottom: 12px;">New Schedule</p>
          <div style="display: grid; gap: 10px; max-width: 480px;">
            <input class="ck-input" placeholder="Schedule name" [(ngModel)]="form.name" />
            <div>
              <p style="font-size: 0.82rem; color: var(--ck-text-soft); margin-bottom: 6px;">Cron expression</p>
              <input class="ck-input" placeholder="0 2 * * *  (daily at 2am)" [(ngModel)]="form.cronExpr" style="font-family: ui-monospace;" />
              <div style="display: flex; gap: 8px; margin-top: 6px; flex-wrap: wrap;">
                @for (preset of cronPresets; track preset.label) {
                  <button class="ck-btn ck-btn--ghost ck-btn--sm" style="font-size: 0.75rem;" (click)="form.cronExpr = preset.value">{{ preset.label }}</button>
                }
              </div>
            </div>
            <div>
              <p style="font-size: 0.82rem; color: var(--ck-text-soft); margin-bottom: 6px;">Sources to include</p>
              @for (src of sources; track src.id) {
                <label style="display: flex; align-items: center; gap: 8px; font-size: 0.84rem; margin-bottom: 4px; cursor: pointer;">
                  <input type="checkbox" [checked]="form.sourceIds.includes(src.id)" (change)="toggleSource(src.id)" />
                  {{ src.sourceKey ?? src.source_key }} <span class="ck-badge ck-badge--accent" style="font-size: 0.72rem;">{{ src.projectKey }}</span>
                </label>
              }
            </div>
            <div style="display: flex; gap: 10px;">
              <button class="ck-btn ck-btn--primary ck-btn--sm" (click)="create()" [disabled]="creating || !form.name || !form.cronExpr || !form.sourceIds.length">
                {{ creating ? 'Creating…' : 'Create Schedule' }}
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
              <th>Cron</th>
              <th>Sources</th>
              <th>Status</th>
              <th>Last Run</th>
              <th>Next Run</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (s of schedules; track s.id) {
              <tr>
                <td style="font-size: 0.84rem; font-weight: 500;">{{ s.name }}</td>
                <td><code style="font-size: 0.8rem; color: var(--ck-text-muted);">{{ s.cronExpr }}</code></td>
                <td style="font-size: 0.8rem; color: var(--ck-text-muted);">{{ s.sourceIds.length }} source{{ s.sourceIds.length !== 1 ? 's' : '' }}</td>
                <td>
                  <span class="ck-badge" [class]="s.active ? 'ck-badge--success' : 'ck-badge--default'">
                    {{ s.active ? 'Active' : 'Paused' }}
                  </span>
                </td>
                <td style="font-size: 0.8rem; color: var(--ck-text-muted);">{{ fmtDate(s.lastRunAt) }}</td>
                <td style="font-size: 0.8rem; color: var(--ck-text-muted);">{{ fmtDate(s.nextRunAt) }}</td>
                <td>
                  <div style="display: flex; gap: 8px;">
                    <button class="ck-btn ck-btn--ghost ck-btn--sm" (click)="toggle(s)">{{ s.active ? 'Pause' : 'Enable' }}</button>
                    <button class="ck-btn ck-btn--ghost ck-btn--sm" style="color: var(--ck-red);" (click)="remove(s)">Delete</button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7" style="text-align: center; color: var(--ck-text-muted);">No schedules configured</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class KnowledgeSchedulesComponent implements OnInit {
  schedules: IngestionSchedule[] = [];
  sources: SourceItem[] = [];
  createOpen = false;
  creating = false;
  form = { name: "", cronExpr: "", sourceIds: [] as string[] };
  readonly cronPresets = [
    { label: "Hourly", value: "0 * * * *" },
    { label: "Daily 2am", value: "0 2 * * *" },
    { label: "Weekly Mon", value: "0 2 * * 1" },
  ];

  constructor(readonly store: CockpitStore, private readonly api: PortalApiService) {
    effect(() => {
      const id = this.store.activeTenantId();
      if (id) this.load(id);
    });
  }

  ngOnInit(): void {}

  private async load(tenantId: string): Promise<void> {
    const [schedules, sourcesResp] = await Promise.all([
      this.api.listSchedules(tenantId),
      this.api.tenantSources(tenantId),
    ]);
    this.schedules = schedules;
    this.sources = sourcesResp;
  }

  toggleSource(id: string): void {
    const idx = this.form.sourceIds.indexOf(id);
    if (idx >= 0) this.form.sourceIds.splice(idx, 1);
    else this.form.sourceIds.push(id);
  }

  async create(): Promise<void> {
    const id = this.store.activeTenantId();
    if (!id) return;
    this.creating = true;
    try {
      const created = await this.api.createSchedule(id, { name: this.form.name, sourceIds: this.form.sourceIds, cronExpr: this.form.cronExpr });
      this.schedules.unshift(created);
      this.createOpen = false;
      this.form = { name: "", cronExpr: "", sourceIds: [] };
    } finally {
      this.creating = false;
    }
  }

  async toggle(s: IngestionSchedule): Promise<void> {
    const id = this.store.activeTenantId();
    if (!id) return;
    const updated = await this.api.updateSchedule(id, s.id, { active: !s.active });
    const idx = this.schedules.findIndex((x) => x.id === s.id);
    if (idx >= 0) this.schedules[idx] = updated;
  }

  async remove(s: IngestionSchedule): Promise<void> {
    const id = this.store.activeTenantId();
    if (!id || !confirm(`Delete schedule "${s.name}"?`)) return;
    await this.api.deleteSchedule(id, s.id);
    this.schedules = this.schedules.filter((x) => x.id !== s.id);
  }

  fmtDate(iso: string | null): string {
    if (!iso) return "—";
    return iso.slice(0, 16).replace("T", " ");
  }
}
