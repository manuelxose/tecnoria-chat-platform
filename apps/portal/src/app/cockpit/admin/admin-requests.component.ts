import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { PortalApiService } from "../../core/portal-api.service";
import { AccessRequest } from "../../core/models";

@Component({
  selector: "app-admin-requests",
  standalone: true,
  imports: [RouterModule, FormsModule],
  template: `
    <div class="ck-content">
      <div class="ck-page-header">
        <div>
          <h1 class="ck-page-header__title">Access Requests</h1>
          <p class="ck-page-header__sub">Review and process inbound access requests</p>
        </div>
        <div class="ck-page-header__actions">
          <span class="ck-badge ck-badge--warning">{{ pendingRequests.length }} pending</span>
          <button class="ck-btn ck-btn--secondary ck-btn--sm" (click)="load()">↻ Refresh</button>
        </div>
      </div>

      <div class="ck-tabs ck-auto-019">
        <button class="ck-tab" [class.is-active]="activeTab === 'pending'" (click)="activeTab = 'pending'">
          Pending ({{ pendingRequests.length }})
        </button>
        <button class="ck-tab" [class.is-active]="activeTab === 'all'" (click)="activeTab = 'all'">
          All ({{ requests.length }})
        </button>
      </div>

      @if (loading) {
        <div class="ck-card">
          @for (i of [1,2,3]; track i) {
            <div class="ck-skeleton ck-auto-020"></div>
          }
        </div>
      } @else if (visibleRequests.length > 0) {
        <div class="ck-auto-021">
          @for (req of visibleRequests; track req.id) {
            <div class="ck-card ck-card--compact">
              <div class="ck-auto-022">
                <div class="ck-auto-023">
                  <div class="ck-auto-024">
                    <strong class="ck-auto-025">{{ req.company }}</strong>
                    <span class="ck-badge" [class]="statusBadge(req.status)">{{ req.status }}</span>
                  </div>
                  <div class="ck-auto-026">
                    <span>{{ req.name }}</span>
                    <span>·</span>
                    <span>{{ req.email }}</span>
                    @if (req.phone) {
                      <span>·</span>
                      <span>{{ req.phone }}</span>
                    }
                    <span>·</span>
                    <span>{{ req.createdAt | date: 'MMM d, yyyy' }}</span>
                  </div>
                  @if (req.message) {
                    <p class="ck-auto-027">
                      "{{ req.message }}"
                    </p>
                  }
                  @if (req.reviewNotes) {
                    <p class="ck-auto-028">
                      Notes: {{ req.reviewNotes }}
                    </p>
                  }
                </div>
                @if (req.status === 'pending') {
                  <div class="ck-auto-029">
                    <button class="ck-btn ck-btn--danger ck-btn--sm" (click)="reject(req)" [disabled]="processingId === req.id">
                      Reject
                    </button>
                    <button class="ck-btn ck-btn--primary ck-btn--sm" (click)="approve(req)" [disabled]="processingId === req.id">
                      {{ processingId === req.id ? 'Processing…' : 'Approve' }}
                    </button>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="ck-card">
          <div class="ck-empty">
            <div class="ck-empty__icon">◎</div>
            <p class="ck-empty__title">
              {{ activeTab === 'pending' ? 'No pending requests' : 'No requests found' }}
            </p>
            <p class="ck-empty__sub">
              {{ activeTab === 'pending' ? 'All access requests have been reviewed.' : 'No access requests have been submitted.' }}
            </p>
          </div>
        </div>
      }
    </div>
  `,
})
export class AdminRequestsComponent implements OnInit {
  requests: AccessRequest[] = [];
  loading = true;
  activeTab: "pending" | "all" = "pending";
  processingId = "";

  get pendingRequests(): AccessRequest[] {
    return this.requests.filter((r) => r.status === "pending");
  }

  get visibleRequests(): AccessRequest[] {
    return this.activeTab === "pending" ? this.pendingRequests : this.requests;
  }

  constructor(private readonly api: PortalApiService) {}

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    try {
      this.requests = await this.api.adminAccessRequests();
    } finally {
      this.loading = false;
    }
  }

  async approve(req: AccessRequest): Promise<void> {
    this.processingId = req.id;
    try {
      await this.api.reviewAccessRequest(req.id, {
        decision: "accepted",
        tenantName: req.requestedTenantName,
      });
      await this.load();
    } finally {
      this.processingId = "";
    }
  }

  async reject(req: AccessRequest): Promise<void> {
    this.processingId = req.id;
    try {
      await this.api.reviewAccessRequest(req.id, {
        decision: "rejected",
        notes: "Reviewed from superadmin panel.",
      });
      await this.load();
    } finally {
      this.processingId = "";
    }
  }

  statusBadge(status: string): string {
    switch (status) {
      case "accepted": return "ck-badge ck-badge--success";
      case "rejected": return "ck-badge ck-badge--danger";
      case "pending": return "ck-badge ck-badge--warning";
      default: return "ck-badge ck-badge--default";
    }
  }
}
