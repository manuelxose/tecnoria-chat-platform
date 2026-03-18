import { Component, OnInit, effect } from "@angular/core";
import { RouterModule } from "@angular/router";
import { CockpitStore } from "../cockpit-store.service";
import { PortalApiService } from "../../core/portal-api.service";
import { HandoverQueueItem } from "../../core/models";

@Component({
  selector: "app-handover-queue",
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="ck-topbar">
      <div class="ck-topbar__breadcrumb">
        <strong>Live</strong>
      </div>
      <div class="ck-topbar__actions">
        <button class="ck-btn ck-btn--ghost ck-btn--sm" (click)="setStatus('pending')" [class.is-active]="filterStatus === 'pending'">Pending</button>
        <button class="ck-btn ck-btn--ghost ck-btn--sm" (click)="setStatus('assigned')" [class.is-active]="filterStatus === 'assigned'">Assigned</button>
        <button class="ck-btn ck-btn--ghost ck-btn--sm" (click)="setStatus('closed')" [class.is-active]="filterStatus === 'closed'">Closed</button>
        <button class="ck-btn ck-btn--secondary ck-btn--sm" (click)="load()">Refresh</button>
      </div>
    </div>

    <div class="ck-content">
      <div class="ck-page-header">
        <div>
          <h1 class="ck-page-header__title">Live Handover Queue</h1>
          <p class="ck-page-header__sub">
            {{ items.length }} {{ filterStatus }} request{{ items.length !== 1 ? 's' : '' }}
          </p>
        </div>
      </div>

      <div class="ck-table-wrap">
        <table class="ck-table">
          <thead>
            <tr>
              <th>Session</th>
              <th>Bot</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Requested</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (item of items; track item.id) {
              <tr>
                <td>
                  <a [routerLink]="['/app/conversations', item.sessionId]"
                     class="ck-table__cell--mono"
                     style="color: var(--ck-accent); text-decoration: none;">
                    {{ item.sessionId.slice(0, 8) }}…
                  </a>
                </td>
                <td style="font-size: 0.84rem;">
                  <span class="ck-badge ck-badge--accent" style="font-size: 0.72rem;">{{ item.projectKey }}</span>
                  {{ item.botName }}
                </td>
                <td style="font-size: 0.82rem; color: var(--ck-text-soft); max-width: 260px;">
                  {{ item.reason ?? '—' }}
                </td>
                <td>
                  <span class="ck-badge" [class]="statusBadge(item.status)">
                    <span class="ck-dot"></span>
                    {{ item.status }}
                  </span>
                </td>
                <td style="font-size: 0.78rem; color: var(--ck-text-muted);">{{ fmtDate(item.createdAt) }}</td>
                <td>
                  <div style="display: flex; gap: 6px;">
                    @if (item.status === 'pending') {
                      <button class="ck-btn ck-btn--primary ck-btn--sm" (click)="claim(item)" [disabled]="busy[item.id]">
                        Claim
                      </button>
                    }
                    @if (item.status === 'assigned') {
                      <button class="ck-btn ck-btn--secondary ck-btn--sm" (click)="resolve(item)" [disabled]="busy[item.id]">
                        Resolve
                      </button>
                    }
                    <a [routerLink]="['/app/conversations', item.sessionId]" class="ck-btn ck-btn--ghost ck-btn--sm">View</a>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" style="text-align: center; color: var(--ck-text-muted);">
                  No {{ filterStatus }} handover requests
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class HandoverQueueComponent implements OnInit {
  items: HandoverQueueItem[] = [];
  filterStatus = "pending";
  busy: Record<string, boolean> = {};

  constructor(readonly store: CockpitStore, private readonly api: PortalApiService) {
    effect(() => {
      const id = this.store.activeTenantId();
      if (id) this.load();
    });
  }

  ngOnInit(): void {}

  setStatus(status: string): void {
    this.filterStatus = status;
    this.load();
  }

  async load(): Promise<void> {
    const id = this.store.activeTenantId();
    if (!id) return;
    this.items = await this.api.listHandovers(id, this.filterStatus);
  }

  async claim(item: HandoverQueueItem): Promise<void> {
    const id = this.store.activeTenantId();
    if (!id) return;
    this.busy[item.id] = true;
    try {
      const updated = await this.api.claimHandover(id, item.id);
      const idx = this.items.findIndex((i) => i.id === item.id);
      if (idx >= 0) this.items[idx] = { ...this.items[idx], ...updated };
      if (this.filterStatus === "pending") this.items = this.items.filter((i) => i.id !== item.id);
    } finally {
      this.busy[item.id] = false;
    }
  }

  async resolve(item: HandoverQueueItem): Promise<void> {
    const id = this.store.activeTenantId();
    if (!id) return;
    this.busy[item.id] = true;
    try {
      const updated = await this.api.resolveHandover(id, item.id);
      const idx = this.items.findIndex((i) => i.id === item.id);
      if (idx >= 0) this.items[idx] = { ...this.items[idx], ...updated };
      if (this.filterStatus === "assigned") this.items = this.items.filter((i) => i.id !== item.id);
    } finally {
      this.busy[item.id] = false;
    }
  }

  statusBadge(status: string): string {
    switch (status) {
      case "pending": return "ck-badge ck-badge--warning";
      case "assigned": return "ck-badge ck-badge--info";
      case "closed": return "ck-badge ck-badge--success";
      default: return "ck-badge ck-badge--default";
    }
  }

  fmtDate(iso: string): string {
    return iso.slice(0, 16).replace("T", " ");
  }
}
