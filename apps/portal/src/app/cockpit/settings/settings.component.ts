import { Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import { CockpitStore } from "../cockpit-store.service";
import { SessionStore } from "../../core/session.store";

@Component({
  selector: "app-settings",
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="ck-topbar">
      <div class="ck-topbar__breadcrumb">
        <strong>Settings</strong>
      </div>
    </div>

    <div class="ck-content">
      <div class="ck-page-header">
        <div>
          <h1 class="ck-page-header__title">Settings</h1>
          <p class="ck-page-header__sub">Workspace and account configuration</p>
        </div>
      </div>

      <div class="ck-auto-194">
        <!-- Workspace info -->
        <div class="ck-card">
          <div class="ck-card__header">
            <p class="ck-card__title">Workspace</p>
          </div>
          <div class="ck-auto-059">
            <div class="ck-auto-048">
              <span class="ck-auto-141">Name</span>
              <strong class="ck-auto-183">{{ store.activeTenant()?.name ?? '—' }}</strong>
            </div>
            <div class="ck-auto-048">
              <span class="ck-auto-141">Slug</span>
              <span class="ck-badge ck-badge--default ck-auto-078">{{ store.activeTenant()?.slug ?? '—' }}</span>
            </div>
            <div class="ck-auto-048">
              <span class="ck-auto-141">Status</span>
              <span class="ck-badge" [class]="tenantStatusBadge()">{{ store.activeTenant()?.status ?? '—' }}</span>
            </div>
            <div class="ck-auto-195">
              <span class="ck-auto-141">Workspace ID</span>
              <span class="ck-auto-196">{{ store.activeTenant()?.id ?? '—' }}</span>
            </div>
          </div>
        </div>

        <!-- Account -->
        <div class="ck-card">
          <div class="ck-card__header">
            <p class="ck-card__title">Account</p>
          </div>
          <div class="ck-auto-059">
            <div class="ck-auto-048">
              <span class="ck-auto-141">Email</span>
              <strong class="ck-auto-183">{{ session.user()?.email ?? '—' }}</strong>
            </div>
            <div class="ck-auto-048">
              <span class="ck-auto-141">Role</span>
              <span class="ck-badge ck-badge--accent">{{ session.user()?.platformRole }}</span>
            </div>
            <div class="ck-auto-195">
              <span class="ck-auto-141">Account status</span>
              <span class="ck-badge ck-badge--success"><span class="ck-dot"></span> {{ session.user()?.status }}</span>
            </div>
          </div>
          <div class="ck-divider"></div>
          <div class="ck-auto-079">
            <a class="ck-btn ck-btn--secondary" routerLink="/reset-password">Change Password</a>
          </div>
        </div>

        <!-- Settings sub-pages -->
        <div class="ck-card">
          <div class="ck-card__header">
            <p class="ck-card__title">Workspace Settings</p>
          </div>
          <div class="ck-auto-197">
            <a routerLink="/app/settings/members" class="ck-card-nav ck-auto-198">
              <span class="ck-auto-014">◎</span>
              <strong class="ck-auto-183">Members</strong>
              <span class="ck-auto-077">Manage team access &amp; roles</span>
            </a>
            <a routerLink="/app/settings/api-keys" class="ck-card-nav ck-auto-198">
              <span class="ck-auto-014">⚿</span>
              <strong class="ck-auto-183">API Keys</strong>
              <span class="ck-auto-077">Programmatic API access</span>
            </a>
            <a routerLink="/app/settings/webhooks" class="ck-card-nav ck-auto-198">
              <span class="ck-auto-014">↗</span>
              <strong class="ck-auto-183">Webhooks</strong>
              <span class="ck-auto-077">Real-time event HTTP callbacks</span>
            </a>
            <a routerLink="/app/settings/notifications" class="ck-card-nav ck-auto-198">
              <span class="ck-auto-014">◈</span>
              <strong class="ck-auto-183">Notifications</strong>
              <span class="ck-auto-077">Email alerts &amp; digest</span>
            </a>
          </div>
        </div>

        <!-- Quick Navigation -->
        <div class="ck-card">
          <div class="ck-card__header">
            <p class="ck-card__title">Quick Navigation</p>
          </div>
          <div class="ck-auto-138">
            <a class="ck-btn ck-btn--ghost ck-auto-139" routerLink="/app/bots" >
              ◈ Manage Bots
            </a>
            <a class="ck-btn ck-btn--ghost ck-auto-139" routerLink="/app/knowledge" >
              ◫ Knowledge Sources
            </a>
            <a class="ck-btn ck-btn--ghost ck-auto-139" routerLink="/app/knowledge/schedules" >
              ⏱ Ingestion Schedules
            </a>
            <a class="ck-btn ck-btn--ghost ck-auto-139" routerLink="/app/analytics" >
              ▣ Analytics
            </a>
            <a class="ck-btn ck-btn--ghost ck-auto-139" routerLink="/app/developers" >
              ⌗ API & Embed
            </a>
            @if (session.user()?.platformRole === 'superadmin') {
              <a class="ck-btn ck-btn--ghost ck-auto-199" routerLink="/admin/overview" >
                ⬡ Platform Administration →
              </a>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class SettingsComponent {
  constructor(
    readonly store: CockpitStore,
    readonly session: SessionStore
  ) {}

  tenantStatusBadge(): string {
    switch (this.store.activeTenant()?.status) {
      case "active": return "ck-badge ck-badge--success";
      case "pending": return "ck-badge ck-badge--warning";
      case "disabled": return "ck-badge ck-badge--default";
      default: return "ck-badge ck-badge--default";
    }
  }
}
