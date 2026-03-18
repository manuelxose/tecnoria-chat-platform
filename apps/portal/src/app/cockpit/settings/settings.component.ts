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

      <div style="max-width: 640px; display: grid; gap: 16px;">
        <!-- Workspace info -->
        <div class="ck-card">
          <div class="ck-card__header">
            <p class="ck-card__title">Workspace</p>
          </div>
          <div style="display: grid; gap: 12px;">
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--ck-border);">
              <span style="font-size: 0.84rem; color: var(--ck-text-soft);">Name</span>
              <strong style="font-size: 0.84rem; color: var(--ck-text);">{{ store.activeTenant()?.name ?? '—' }}</strong>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--ck-border);">
              <span style="font-size: 0.84rem; color: var(--ck-text-soft);">Slug</span>
              <span class="ck-badge ck-badge--default" style="font-family: ui-monospace;">{{ store.activeTenant()?.slug ?? '—' }}</span>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--ck-border);">
              <span style="font-size: 0.84rem; color: var(--ck-text-soft);">Status</span>
              <span class="ck-badge" [class]="tenantStatusBadge()">{{ store.activeTenant()?.status ?? '—' }}</span>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0;">
              <span style="font-size: 0.84rem; color: var(--ck-text-soft);">Workspace ID</span>
              <span style="font-family: ui-monospace; font-size: 0.78rem; color: var(--ck-text-muted);">{{ store.activeTenant()?.id ?? '—' }}</span>
            </div>
          </div>
        </div>

        <!-- Account -->
        <div class="ck-card">
          <div class="ck-card__header">
            <p class="ck-card__title">Account</p>
          </div>
          <div style="display: grid; gap: 12px;">
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--ck-border);">
              <span style="font-size: 0.84rem; color: var(--ck-text-soft);">Email</span>
              <strong style="font-size: 0.84rem; color: var(--ck-text);">{{ session.user()?.email ?? '—' }}</strong>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--ck-border);">
              <span style="font-size: 0.84rem; color: var(--ck-text-soft);">Role</span>
              <span class="ck-badge ck-badge--accent">{{ session.user()?.platformRole }}</span>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0;">
              <span style="font-size: 0.84rem; color: var(--ck-text-soft);">Account status</span>
              <span class="ck-badge ck-badge--success"><span class="ck-dot"></span> {{ session.user()?.status }}</span>
            </div>
          </div>
          <div class="ck-divider"></div>
          <div style="display: flex; gap: 8px;">
            <a class="ck-btn ck-btn--secondary" routerLink="/reset-password">Change Password</a>
          </div>
        </div>

        <!-- Settings sub-pages -->
        <div class="ck-card">
          <div class="ck-card__header">
            <p class="ck-card__title">Workspace Settings</p>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <a routerLink="/app/settings/members" style="display: flex; flex-direction: column; gap: 4px; padding: 14px; border-radius: var(--ck-radius-sm); border: 1px solid var(--ck-border); background: var(--ck-surface-raised); text-decoration: none; cursor: pointer; transition: border-color 0.15s;" class="ck-card-nav">
              <span style="font-size: 1.2rem;">◎</span>
              <strong style="font-size: 0.84rem; color: var(--ck-text);">Members</strong>
              <span style="font-size: 0.78rem; color: var(--ck-text-muted);">Manage team access &amp; roles</span>
            </a>
            <a routerLink="/app/settings/api-keys" style="display: flex; flex-direction: column; gap: 4px; padding: 14px; border-radius: var(--ck-radius-sm); border: 1px solid var(--ck-border); background: var(--ck-surface-raised); text-decoration: none; cursor: pointer; transition: border-color 0.15s;" class="ck-card-nav">
              <span style="font-size: 1.2rem;">⚿</span>
              <strong style="font-size: 0.84rem; color: var(--ck-text);">API Keys</strong>
              <span style="font-size: 0.78rem; color: var(--ck-text-muted);">Programmatic API access</span>
            </a>
            <a routerLink="/app/settings/webhooks" style="display: flex; flex-direction: column; gap: 4px; padding: 14px; border-radius: var(--ck-radius-sm); border: 1px solid var(--ck-border); background: var(--ck-surface-raised); text-decoration: none; cursor: pointer; transition: border-color 0.15s;" class="ck-card-nav">
              <span style="font-size: 1.2rem;">↗</span>
              <strong style="font-size: 0.84rem; color: var(--ck-text);">Webhooks</strong>
              <span style="font-size: 0.78rem; color: var(--ck-text-muted);">Real-time event HTTP callbacks</span>
            </a>
            <a routerLink="/app/settings/notifications" style="display: flex; flex-direction: column; gap: 4px; padding: 14px; border-radius: var(--ck-radius-sm); border: 1px solid var(--ck-border); background: var(--ck-surface-raised); text-decoration: none; cursor: pointer; transition: border-color 0.15s;" class="ck-card-nav">
              <span style="font-size: 1.2rem;">◈</span>
              <strong style="font-size: 0.84rem; color: var(--ck-text);">Notifications</strong>
              <span style="font-size: 0.78rem; color: var(--ck-text-muted);">Email alerts &amp; digest</span>
            </a>
          </div>
        </div>

        <!-- Quick Navigation -->
        <div class="ck-card">
          <div class="ck-card__header">
            <p class="ck-card__title">Quick Navigation</p>
          </div>
          <div style="display: grid; gap: 8px;">
            <a class="ck-btn ck-btn--ghost" routerLink="/app/bots" style="justify-content: flex-start;">
              ◈ Manage Bots
            </a>
            <a class="ck-btn ck-btn--ghost" routerLink="/app/knowledge" style="justify-content: flex-start;">
              ◫ Knowledge Sources
            </a>
            <a class="ck-btn ck-btn--ghost" routerLink="/app/knowledge/schedules" style="justify-content: flex-start;">
              ⏱ Ingestion Schedules
            </a>
            <a class="ck-btn ck-btn--ghost" routerLink="/app/analytics" style="justify-content: flex-start;">
              ▣ Analytics
            </a>
            <a class="ck-btn ck-btn--ghost" routerLink="/app/developers" style="justify-content: flex-start;">
              ⌗ API & Embed
            </a>
            @if (session.user()?.platformRole === 'superadmin') {
              <a class="ck-btn ck-btn--ghost" routerLink="/admin/overview" style="justify-content: flex-start; color: var(--ck-accent-strong);">
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
