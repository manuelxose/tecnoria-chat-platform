import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { PortalApiService } from "../../core/portal-api.service";
import { PortalUser, Tenant } from "../../core/models";

@Component({
  selector: "app-admin-users",
  standalone: true,
  imports: [RouterModule, FormsModule],
  template: `
    <div class="ck-topbar">
      <div class="ck-topbar__breadcrumb">
        <a routerLink="/admin/overview" style="color: var(--ck-text-muted); text-decoration: none;">Superadmin</a>
        <span>›</span>
        <strong>Users</strong>
      </div>
    </div>

    <div class="ck-content">
      <div class="ck-page-header">
        <div>
          <h1 class="ck-page-header__title">Users</h1>
          <p class="ck-page-header__sub">All platform accounts and memberships</p>
        </div>
      </div>

      <div class="ck-grid-sidebar">
        <!-- Users table -->
        <div>
          <div class="ck-toolbar">
            <div class="ck-search-wrap">
              <span class="ck-search-icon">⌕</span>
              <input class="ck-input ck-search" type="text" placeholder="Search users..." [(ngModel)]="searchQuery" />
            </div>
            <select class="ck-select" style="width: auto; min-width: 120px;" [(ngModel)]="filterRole">
              <option value="">All roles</option>
              <option value="superadmin">Superadmin</option>
              <option value="member">Member</option>
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
                    <th>Email</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Workspaces</th>
                  </tr>
                </thead>
                <tbody>
                  @for (user of filtered; track user.id) {
                    <tr>
                      <td class="ck-table__cell--strong">{{ user.email }}</td>
                      <td style="color: var(--ck-text-soft);">{{ user.displayName ?? '—' }}</td>
                      <td>
                        <span class="ck-badge" [class]="roleBadge(user.platformRole)">{{ user.platformRole }}</span>
                      </td>
                      <td>
                        <span class="ck-badge" [class]="statusBadge(user.status)">
                          <span class="ck-dot"></span>{{ user.status }}
                        </span>
                      </td>
                      <td style="color: var(--ck-text-muted); font-size: 0.8rem;">
                        {{ user.memberships.length }} workspace{{ user.memberships.length !== 1 ? 's' : '' }}
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
                <p class="ck-empty__title">No users found</p>
              </div>
            </div>
          }
        </div>

        <!-- Create user + membership -->
        <div style="display: grid; gap: 16px; align-content: start;">
          <!-- Create user -->
          <div class="ck-card">
            <div class="ck-card__header">
              <p class="ck-card__title">Create User</p>
            </div>
            @if (userSuccess) {
              <div class="ck-alert ck-alert--success" style="margin-bottom: 12px;">User created.</div>
            }
            @if (userError) {
              <div class="ck-alert ck-alert--danger" style="margin-bottom: 12px;">{{ userError }}</div>
            }
            <div class="ck-form-stack">
              <div class="ck-field">
                <label class="ck-label">Email</label>
                <input class="ck-input" [(ngModel)]="userForm.email" type="email" placeholder="user@example.com" />
              </div>
              <div class="ck-field">
                <label class="ck-label">Display Name</label>
                <input class="ck-input" [(ngModel)]="userForm.displayName" placeholder="John Doe" />
              </div>
              <div class="ck-form-grid">
                <div class="ck-field">
                  <label class="ck-label">Role</label>
                  <select class="ck-select" [(ngModel)]="userForm.platformRole">
                    <option value="member">Member</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                </div>
                <div class="ck-field">
                  <label class="ck-label">Status</label>
                  <select class="ck-select" [(ngModel)]="userForm.status">
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>
              <div class="ck-field">
                <label class="ck-label">Initial Password</label>
                <input class="ck-input" [(ngModel)]="userForm.password" type="password" placeholder="••••••••" />
              </div>
              <button class="ck-btn ck-btn--primary" style="width: 100%;" (click)="createUser()" [disabled]="creatingUser">
                {{ creatingUser ? 'Creating…' : 'Create User' }}
              </button>
            </div>
          </div>

          <!-- Assign membership -->
          <div class="ck-card">
            <div class="ck-card__header">
              <p class="ck-card__title">Assign Workspace</p>
            </div>
            @if (membershipSuccess) {
              <div class="ck-alert ck-alert--success" style="margin-bottom: 12px;">Membership assigned.</div>
            }
            <div class="ck-form-stack">
              <div class="ck-field">
                <label class="ck-label">User</label>
                <select class="ck-select" [(ngModel)]="membershipForm.userId">
                  @for (u of users; track u.id) {
                    <option [value]="u.id">{{ u.email }}</option>
                  }
                </select>
              </div>
              <div class="ck-field">
                <label class="ck-label">Workspace</label>
                <select class="ck-select" [(ngModel)]="membershipForm.tenantId">
                  @for (t of tenants; track t.id) {
                    <option [value]="t.id">{{ t.name }}</option>
                  }
                </select>
              </div>
              <div class="ck-field">
                <label class="ck-label">Role</label>
                <select class="ck-select" [(ngModel)]="membershipForm.role">
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <button class="ck-btn ck-btn--secondary" style="width: 100%;" (click)="assignMembership()" [disabled]="assigningMembership">
                {{ assigningMembership ? 'Assigning…' : 'Assign' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdminUsersComponent implements OnInit {
  users: Array<PortalUser & { createdAt?: string; lastLoginAt?: string }> = [];
  tenants: Tenant[] = [];
  loading = true;
  searchQuery = "";
  filterRole = "";

  creatingUser = false;
  userSuccess = false;
  userError = "";
  assigningMembership = false;
  membershipSuccess = false;

  userForm = { email: "", displayName: "", platformRole: "member", status: "pending", password: "" };
  membershipForm = { userId: "", tenantId: "", role: "admin" };

  get filtered(): typeof this.users {
    const q = this.searchQuery.toLowerCase();
    return this.users.filter((u) => {
      const matchSearch = !q || u.email.toLowerCase().includes(q) || (u.displayName ?? "").toLowerCase().includes(q);
      const matchRole = !this.filterRole || u.platformRole === this.filterRole;
      return matchSearch && matchRole;
    });
  }

  constructor(private readonly api: PortalApiService) {}

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    try {
      [this.users, this.tenants] = await Promise.all([
        this.api.adminUsers(),
        this.api.adminTenants(),
      ]);
      if (this.users.length && !this.membershipForm.userId) {
        this.membershipForm.userId = this.users[0].id;
      }
      if (this.tenants.length && !this.membershipForm.tenantId) {
        this.membershipForm.tenantId = this.tenants[0].id;
      }
    } finally {
      this.loading = false;
    }
  }

  async createUser(): Promise<void> {
    this.creatingUser = true;
    this.userError = "";
    try {
      await this.api.upsertUser({ ...this.userForm });
      this.userForm = { email: "", displayName: "", platformRole: "member", status: "pending", password: "" };
      this.userSuccess = true;
      await this.load();
      setTimeout(() => (this.userSuccess = false), 3000);
    } catch (e: any) {
      this.userError = e?.message ?? "Failed to create user.";
    } finally {
      this.creatingUser = false;
    }
  }

  async assignMembership(): Promise<void> {
    this.assigningMembership = true;
    try {
      await this.api.upsertMembership({ ...this.membershipForm });
      this.membershipSuccess = true;
      setTimeout(() => (this.membershipSuccess = false), 3000);
    } finally {
      this.assigningMembership = false;
    }
  }

  roleBadge(role: string): string {
    return role === "superadmin" ? "ck-badge ck-badge--danger" : "ck-badge ck-badge--accent";
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
