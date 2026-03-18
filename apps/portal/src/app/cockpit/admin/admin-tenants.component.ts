import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { PortalApiService } from "../../core/portal-api.service";
import { Tenant } from "../../core/models";

@Component({
  selector: "app-admin-tenants",
  standalone: true,
  imports: [RouterModule, FormsModule],
  template: `
    <div class="ck-topbar">
      <div class="ck-topbar__breadcrumb">
        <a routerLink="/admin/overview" style="color: var(--ck-text-muted); text-decoration: none;">Superadmin</a>
        <span>›</span>
        <strong>Tenants</strong>
      </div>
    </div>

    <div class="ck-content">
      <div class="ck-page-header">
        <div>
          <h1 class="ck-page-header__title">Tenants</h1>
          <p class="ck-page-header__sub">Organizations using the platform</p>
        </div>
        <div class="ck-page-header__actions">
          <span class="ck-badge ck-badge--default">{{ tenants.length }} total</span>
        </div>
      </div>

      <div class="ck-grid-sidebar">
        <!-- Tenants list -->
        <div>
          <div class="ck-toolbar">
            <div class="ck-search-wrap">
              <span class="ck-search-icon">⌕</span>
              <input class="ck-input ck-search" type="text" placeholder="Search tenants..." [(ngModel)]="searchQuery" />
            </div>
          </div>

          @if (loading) {
            <div class="ck-card">
              @for (i of [1,2,3,4]; track i) {
                <div class="ck-skeleton" style="height: 44px; margin-bottom: 8px;"></div>
              }
            </div>
          } @else if (filtered.length > 0) {
            <div class="ck-table-wrap">
              <table class="ck-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Status</th>
                    <th>ID</th>
                  </tr>
                </thead>
                <tbody>
                  @for (tenant of filtered; track tenant.id) {
                    <tr>
                      <td class="ck-table__cell--strong">{{ tenant.name }}</td>
                      <td class="ck-table__cell--mono">{{ tenant.slug }}</td>
                      <td>
                        <span class="ck-badge" [class]="statusBadge(tenant.status)">
                          <span class="ck-dot"></span>{{ tenant.status }}
                        </span>
                      </td>
                      <td style="color: var(--ck-text-muted); font-size: 0.72rem; font-family: ui-monospace;">
                        {{ tenant.id.slice(0, 8) }}…
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
                <p class="ck-empty__title">No tenants found</p>
              </div>
            </div>
          }
        </div>

        <!-- Create tenant form -->
        <div class="ck-card">
          <div class="ck-card__header">
            <p class="ck-card__title">Create Tenant</p>
          </div>
          @if (createSuccess) {
            <div class="ck-alert ck-alert--success" style="margin-bottom: 12px;">Tenant created.</div>
          }
          @if (createError) {
            <div class="ck-alert ck-alert--danger" style="margin-bottom: 12px;">{{ createError }}</div>
          }
          <div class="ck-form-stack">
            <div class="ck-field">
              <label class="ck-label">Tenant Name</label>
              <input class="ck-input" [(ngModel)]="form.name" placeholder="Acme Corp" />
            </div>
            <div class="ck-field">
              <label class="ck-label">Slug</label>
              <input class="ck-input" [(ngModel)]="form.slug" placeholder="acme-corp" />
            </div>
            <button class="ck-btn ck-btn--primary" style="width: 100%;" (click)="create()" [disabled]="creating">
              {{ creating ? 'Creating…' : 'Create Tenant' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdminTenantsComponent implements OnInit {
  tenants: Tenant[] = [];
  loading = true;
  creating = false;
  createSuccess = false;
  createError = "";
  searchQuery = "";

  form = { name: "", slug: "" };

  get filtered(): Tenant[] {
    const q = this.searchQuery.toLowerCase();
    return this.tenants.filter(
      (t) => !q || t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q)
    );
  }

  constructor(private readonly api: PortalApiService) {}

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    try {
      this.tenants = await this.api.adminTenants();
    } finally {
      this.loading = false;
    }
  }

  async create(): Promise<void> {
    this.creating = true;
    this.createError = "";
    try {
      await this.api.upsertTenant({ ...this.form });
      this.form = { name: "", slug: "" };
      this.createSuccess = true;
      await this.load();
      setTimeout(() => (this.createSuccess = false), 3000);
    } catch (e: any) {
      this.createError = e?.message ?? "Failed to create tenant.";
    } finally {
      this.creating = false;
    }
  }

  statusBadge(status: string): string {
    switch (status) {
      case "active": return "ck-badge ck-badge--success";
      case "pending": return "ck-badge ck-badge--warning";
      case "disabled": return "ck-badge ck-badge--default";
      default: return "ck-badge ck-badge--default";
    }
  }
}
