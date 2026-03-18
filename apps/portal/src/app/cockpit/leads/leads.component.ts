import { Component, OnInit, effect } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { CockpitStore } from "../cockpit-store.service";
import { PortalApiService } from "../../core/portal-api.service";
import { LeadItem } from "../../core/models";

@Component({
  selector: "app-leads",
  standalone: true,
  imports: [RouterModule, FormsModule],
  template: `
    <div class="ck-topbar">
      <div class="ck-topbar__breadcrumb">
        <strong>Leads</strong>
      </div>
      <div class="ck-topbar__actions">
        <span style="font-size: 0.84rem; color: var(--ck-text-muted);">{{ leads.length }} total</span>
      </div>
    </div>

    <div class="ck-content">
      <div class="ck-page-header">
        <div>
          <h1 class="ck-page-header__title">Leads</h1>
          <p class="ck-page-header__sub">Contacts captured through bot conversations</p>
        </div>
      </div>

      <div class="ck-toolbar">
        <select class="ck-select" style="width: auto; min-width: 140px;" [(ngModel)]="filterStatus">
          <option value="">All status</option>
          <option value="delivered">Delivered</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      @if (loading) {
        <div class="ck-card">
          @for (i of [1,2,3,4]; track i) {
            <div class="ck-skeleton" style="height: 52px; margin-bottom: 8px;"></div>
          }
        </div>
      } @else if (filtered.length > 0) {
        <div class="ck-table-wrap">
          <table class="ck-table">
            <thead>
              <tr>
                <th>Lead ID</th>
                <th>Bot</th>
                <th>Delivery</th>
                <th>Data</th>
                <th>Captured</th>
              </tr>
            </thead>
            <tbody>
              @for (lead of filtered; track lead.id) {
                <tr>
                  <td class="ck-table__cell--mono" style="font-size: 0.75rem;">{{ lead.id.slice(0, 8) }}…</td>
                  <td><span class="ck-badge ck-badge--accent">{{ lead.projectKey ?? lead.projectId }}</span></td>
                  <td>
                    <span class="ck-badge" [class]="statusBadge(lead.deliveryStatus)">
                      <span class="ck-dot"></span>
                      {{ lead.deliveryStatus }}
                    </span>
                  </td>
                  <td>
                    @if (lead.payload) {
                      <div style="font-size: 0.78rem; color: var(--ck-text-soft);">
                        @for (key of payloadKeys(lead.payload); track key) {
                          <span>{{ key }}: {{ lead.payload[key] }}</span>
                          &nbsp;&nbsp;
                        }
                      </div>
                    }
                  </td>
                  <td style="color: var(--ck-text-muted); font-size: 0.78rem;">
                    {{ lead.createdAt | date: 'MMM d, HH:mm' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <div class="ck-card">
          <div class="ck-empty">
            <div class="ck-empty__icon">◉</div>
            <p class="ck-empty__title">No leads yet</p>
            <p class="ck-empty__sub">
              Leads captured from bot conversations will appear here. Configure a CTA in your bot to start capturing leads.
            </p>
            <a class="ck-btn ck-btn--secondary" routerLink="/app/bots">Configure Bots</a>
          </div>
        </div>
      }
    </div>
  `,
})
export class LeadsComponent implements OnInit {
  leads: LeadItem[] = [];
  loading = true;
  filterStatus = "";

  get filtered(): LeadItem[] {
    return this.leads.filter((l) => !this.filterStatus || l.deliveryStatus === this.filterStatus);
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
      this.leads = await this.api.tenantLeads(tenantId);
    } finally {
      this.loading = false;
    }
  }

  payloadKeys(payload: Record<string, unknown>): string[] {
    return Object.keys(payload).slice(0, 3);
  }

  statusBadge(status: string): string {
    switch (status) {
      case "delivered": return "ck-badge ck-badge--success";
      case "failed": return "ck-badge ck-badge--danger";
      case "pending": return "ck-badge ck-badge--warning";
      default: return "ck-badge ck-badge--default";
    }
  }
}
