import { Component, OnInit } from "@angular/core";
import { Router, RouterModule, RouterOutlet } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { SessionStore } from "../../core/session.store";
import { PortalApiService } from "../../core/portal-api.service";
import { CockpitStore } from "../cockpit-store.service";

@Component({
  selector: "app-cockpit-shell",
  standalone: true,
  imports: [RouterOutlet, RouterModule, FormsModule],
  template: `
    <div class="ck-surface--cockpit ck-shell">
      <!-- SIDEBAR -->
      <aside class="ck-sidebar">
        <!-- Brand -->
        <a class="ck-brand" routerLink="/app/dashboard">
          <span class="ck-brand__mark">T</span>
          <span class="ck-brand__name">Talkaris</span>
        </a>

        <!-- Workspace selector -->
        <div class="ck-workspace">
          <div class="ck-workspace__label">Workspace</div>
          <select
            class="ck-workspace__select"
            [ngModel]="store.activeTenantId()"
            (ngModelChange)="store.setActiveTenantId($event)"
          >
            @for (t of store.tenants(); track t.id) {
              <option [value]="t.id">{{ t.name }}</option>
            }
          </select>
        </div>

        <!-- Navigation -->
        <nav class="ck-nav">
          <!-- Overview -->
          <div class="ck-nav__group">
            <a class="ck-nav__item" routerLink="/app/dashboard" routerLinkActive="is-active">
              <span class="ck-nav__icon">⬡</span> Dashboard
            </a>
          </div>

          <!-- Bots -->
          <div class="ck-nav__group">
            <div class="ck-nav__group-label">Bots</div>
            <a class="ck-nav__item" routerLink="/app/bots" routerLinkActive="is-active" [routerLinkActiveOptions]="{ exact: true }">
              <span class="ck-nav__icon">◈</span> All Bots
            </a>
            <a class="ck-nav__item" routerLink="/app/bots/new" routerLinkActive="is-active">
              <span class="ck-nav__icon">+</span> Create Bot
            </a>
            <a class="ck-nav__item" routerLink="/app/deployments" routerLinkActive="is-active">
              <span class="ck-nav__icon">▲</span> Deployments
            </a>
          </div>

          <!-- Conversations -->
          <div class="ck-nav__group">
            <div class="ck-nav__group-label">Conversations</div>
            <a class="ck-nav__item" routerLink="/app/conversations" routerLinkActive="is-active" [routerLinkActiveOptions]="{ exact: true }">
              <span class="ck-nav__icon">◎</span> History
            </a>
            <a class="ck-nav__item" routerLink="/app/conversations/live" routerLinkActive="is-active">
              <span class="ck-nav__icon">●</span> Live
            </a>
          </div>

          <!-- Knowledge -->
          <div class="ck-nav__group">
            <div class="ck-nav__group-label">Knowledge</div>
            <a class="ck-nav__item" routerLink="/app/knowledge" routerLinkActive="is-active" [routerLinkActiveOptions]="{ exact: true }">
              <span class="ck-nav__icon">◫</span> Sources
            </a>
            <a class="ck-nav__item" routerLink="/app/knowledge/documents" routerLinkActive="is-active">
              <span class="ck-nav__icon">≡</span> Documents
            </a>
            <a class="ck-nav__item" routerLink="/app/knowledge/ingestions" routerLinkActive="is-active">
              <span class="ck-nav__icon">↻</span> Ingestion Jobs
            </a>
            <a class="ck-nav__item" routerLink="/app/knowledge/schedules" routerLinkActive="is-active">
              <span class="ck-nav__icon">⏱</span> Schedules
            </a>
          </div>

          <!-- Analytics & Leads -->
          <div class="ck-nav__group">
            <div class="ck-nav__group-label">Data</div>
            <a class="ck-nav__item" routerLink="/app/analytics" routerLinkActive="is-active">
              <span class="ck-nav__icon">▣</span> Analytics
            </a>
            <a class="ck-nav__item" routerLink="/app/leads" routerLinkActive="is-active">
              <span class="ck-nav__icon">◉</span> Leads
            </a>
            <a class="ck-nav__item" routerLink="/app/channels" routerLinkActive="is-active">
              <span class="ck-nav__icon">⇄</span> Channels
            </a>
          </div>

          <!-- Developers -->
          <div class="ck-nav__group">
            <div class="ck-nav__group-label">Developers</div>
            <a class="ck-nav__item" routerLink="/app/developers" routerLinkActive="is-active">
              <span class="ck-nav__icon">⌗</span> API & Embed
            </a>
            <a class="ck-nav__item" routerLink="/app/settings/api-keys" routerLinkActive="is-active">
              <span class="ck-nav__icon">⚿</span> API Keys
            </a>
            <a class="ck-nav__item" routerLink="/app/settings/webhooks" routerLinkActive="is-active">
              <span class="ck-nav__icon">↗</span> Webhooks
            </a>
          </div>

          <!-- Settings -->
          <div class="ck-nav__group">
            <div class="ck-nav__group-label">Settings</div>
            <a class="ck-nav__item" routerLink="/app/settings" routerLinkActive="is-active" [routerLinkActiveOptions]="{ exact: true }">
              <span class="ck-nav__icon">⊙</span> Workspace
            </a>
            <a class="ck-nav__item" routerLink="/app/settings/members" routerLinkActive="is-active">
              <span class="ck-nav__icon">◎</span> Members
            </a>
            <a class="ck-nav__item" routerLink="/app/settings/notifications" routerLinkActive="is-active">
              <span class="ck-nav__icon">◈</span> Notifications
            </a>
            @if (session.user()?.platformRole === 'superadmin') {
              <a class="ck-nav__item" routerLink="/admin/overview" routerLinkActive="is-active">
                <span class="ck-nav__icon">⬡</span> Superadmin
              </a>
            }
          </div>
        </nav>

        <!-- User footer -->
        <div class="ck-sidebar-footer">
          <div class="ck-user-pill">
            <span class="ck-user-pill__avatar">
              {{ userInitial }}
            </span>
            <div class="ck-user-pill__info">
              <div class="ck-user-pill__email">{{ session.user()?.email }}</div>
              <div class="ck-user-pill__role">{{ session.user()?.platformRole }}</div>
            </div>
            <button class="ck-user-pill__btn" (click)="logout()" title="Sign out">⎋</button>
          </div>
        </div>
      </aside>

      <!-- MAIN -->
      <main class="ck-main">
        <header class="ck-appbar">
          <div class="ck-appbar__meta">
            <p class="ck-appbar__eyebrow">{{ shellModeLabel }}</p>
            <div class="ck-appbar__breadcrumb">
              <span>{{ shellSection }}</span>
              <span>›</span>
              <strong>{{ shellTitle }}</strong>
            </div>
          </div>
          <div class="ck-appbar__actions">
            @if (store.activeTenant()?.name) {
              <span class="ck-badge ck-badge--default">{{ store.activeTenant()?.name }}</span>
            }
            <span class="ck-badge ck-badge--accent">{{ session.user()?.platformRole }}</span>
          </div>
        </header>

        <section class="ck-workbench">
          <div class="ck-route-host">
            <router-outlet />
          </div>
        </section>
      </main>
    </div>
  `,
})
export class CockpitShellComponent implements OnInit {
  get userInitial(): string {
    const email = this.session.user()?.email ?? "?";
    return email.charAt(0).toUpperCase();
  }

  constructor(
    readonly session: SessionStore,
    readonly store: CockpitStore,
    private readonly api: PortalApiService,
    private readonly router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    await this.session.ensureLoaded();
    if (!this.session.user()) {
      await this.router.navigate(["/login"]);
      return;
    }
    const tenants = await this.api.listTenants();
    this.store.setTenants(tenants);
  }

  async logout(): Promise<void> {
    await this.session.logout();
    window.location.href = "/login";
  }

  get shellModeLabel(): string {
    return "Workspace";
  }

  get shellSection(): string {
    return this.routeData("section", "Workspace");
  }

  get shellTitle(): string {
    return this.routeData("title", "Dashboard");
  }

  private routeData(key: string, fallback: string): string {
    let snapshot = this.router.routerState.snapshot.root;
    while (snapshot.firstChild) {
      snapshot = snapshot.firstChild;
    }
    const value = snapshot.data[key];
    return typeof value === "string" && value.trim() ? value : fallback;
  }
}
