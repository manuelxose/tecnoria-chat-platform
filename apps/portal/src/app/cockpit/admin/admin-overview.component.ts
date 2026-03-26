import { Component, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";
import { PortalApiService } from "../../core/portal-api.service";
import { AdminOverview } from "../../core/models";

@Component({
  selector: "app-admin-overview",
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="ck-content">
      <div class="ck-page-header">
        <div>
          <h1 class="ck-page-header__title">Platform Overview</h1>
          <p class="ck-page-header__sub">Global state of the Talkaris platform</p>
        </div>
        <div class="ck-page-header__actions">
          <span class="ck-badge ck-badge--danger">Superadmin</span>
        </div>
      </div>

      @if (overview) {
        <!-- Stats -->
        <div class="ck-stats">
          <div class="ck-stat">
            <div class="ck-stat__label">Tenants</div>
            <div class="ck-stat__value">{{ overview.counts.tenants }}</div>
            <div class="ck-stat__delta">Organizations</div>
          </div>
          <div class="ck-stat">
            <div class="ck-stat__label">Users</div>
            <div class="ck-stat__value">{{ overview.counts.users }}</div>
            <div class="ck-stat__delta">Platform accounts</div>
          </div>
          <div class="ck-stat">
            <div class="ck-stat__label">Projects</div>
            <div class="ck-stat__value">{{ overview.counts.projects }}</div>
            <div class="ck-stat__delta">Active bots</div>
          </div>
          <div class="ck-stat">
            <div class="ck-stat__label">Conversations</div>
            <div class="ck-stat__value">{{ overview.counts.conversations }}</div>
            <div class="ck-stat__delta">All time</div>
          </div>
          <div class="ck-stat">
            <div class="ck-stat__label">Leads</div>
            <div class="ck-stat__value">{{ overview.counts.leads }}</div>
            <div class="ck-stat__delta">Captured</div>
          </div>
          <div class="ck-stat">
            <div class="ck-stat__label">Pending Requests</div>
            <div class="ck-stat__value" [class.ck-score--warning]="overview.counts.pending_requests > 0">
              {{ overview.counts.pending_requests }}
            </div>
            <div class="ck-stat__delta">Awaiting review</div>
          </div>
        </div>

        <!-- Recent requests -->
        @if (overview.recentRequests.length > 0) {
          <div class="ck-card">
            <div class="ck-card__header">
              <div>
                <p class="ck-card__title">Recent Access Requests</p>
                <p class="ck-card__sub">Latest access requests awaiting review</p>
              </div>
              <a class="ck-btn ck-btn--secondary ck-btn--sm" routerLink="/admin/requests">View all</a>
            </div>
            <div class="ck-table-wrap">
              <table class="ck-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (req of overview.recentRequests.slice(0, 5); track req.id) {
                    <tr>
                      <td class="ck-table__cell--strong">{{ req.company }}</td>
                      <td>
                        <div>{{ req.name }}</div>
                        <div class="ck-auto-009">{{ req.email }}</div>
                      </td>
                      <td>
                        <span class="ck-badge" [class]="requestBadge(req.status)">{{ req.status }}</span>
                      </td>
                      <td class="ck-auto-010">
                        {{ req.createdAt | date: 'MMM d' }}
                      </td>
                      <td>
                        <a class="ck-btn ck-btn--ghost ck-btn--sm" routerLink="/admin/requests">Review</a>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      } @else {
        <div class="ck-stats">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="ck-stat"><div class="ck-skeleton ck-auto-011"></div></div>
          }
        </div>
      }

      <!-- Quick admin links -->
      <div class="ck-grid-three ck-auto-012">
        <a class="ck-card ck-auto-013" routerLink="/admin/requests">
          <div class="ck-card__header">
            <div>
              <p class="ck-card__title">Access Requests</p>
              <p class="ck-card__sub">Review and approve new tenants</p>
            </div>
            <span class="ck-auto-014">◎</span>
          </div>
          @if (overview && overview.counts.pending_requests > 0) {
            <span class="ck-badge ck-badge--warning">{{ overview.counts.pending_requests }} pending</span>
          }
        </a>

        <a class="ck-card ck-auto-015" routerLink="/admin/tenants" >
          <div class="ck-card__header">
            <div>
              <p class="ck-card__title">Tenants</p>
              <p class="ck-card__sub">Manage organizations</p>
            </div>
            <span class="ck-auto-014">◈</span>
          </div>
          <span class="ck-badge ck-badge--default">{{ overview?.counts?.tenants ?? 0 }} total</span>
        </a>

        <a class="ck-card ck-auto-015" routerLink="/admin/users" >
          <div class="ck-card__header">
            <div>
              <p class="ck-card__title">Users</p>
              <p class="ck-card__sub">Manage platform accounts</p>
            </div>
            <span class="ck-auto-014">◉</span>
          </div>
          <span class="ck-badge ck-badge--default">{{ overview?.counts?.users ?? 0 }} total</span>
        </a>
      </div>
    </div>
  `,
})
export class AdminOverviewComponent implements OnInit {
  overview: AdminOverview | null = null;

  constructor(private readonly api: PortalApiService) {}

  async ngOnInit(): Promise<void> {
    this.overview = await this.api.adminOverview();
  }

  requestBadge(status: string): string {
    switch (status) {
      case "accepted": return "ck-badge ck-badge--success";
      case "rejected": return "ck-badge ck-badge--danger";
      case "pending": return "ck-badge ck-badge--warning";
      default: return "ck-badge ck-badge--default";
    }
  }
}
