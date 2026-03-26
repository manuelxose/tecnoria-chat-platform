import { Component, OnInit } from "@angular/core";
import { Router, RouterModule, RouterOutlet } from "@angular/router";
import { SessionStore } from "../../core/session.store";

@Component({
  selector: "app-admin-shell",
  standalone: true,
  imports: [RouterOutlet, RouterModule],
  template: `
    <div class="ck-surface--cockpit ck-shell">
      <!-- SIDEBAR -->
      <aside class="ck-sidebar">
        <!-- Brand -->
        <a class="ck-brand" routerLink="/admin/overview">
          <span class="ck-brand__mark ck-auto-030">⬡</span>
          <span class="ck-brand__name">Superadmin</span>
        </a>

        <!-- Navigation -->
        <nav class="ck-nav">
          <div class="ck-nav__group">
            <a class="ck-nav__item" routerLink="/admin/overview" routerLinkActive="is-active">
              <span class="ck-nav__icon">⬡</span> Overview
            </a>
          </div>

          <div class="ck-nav__group">
            <div class="ck-nav__group-label">Platform</div>
            <a class="ck-nav__item" routerLink="/admin/requests" routerLinkActive="is-active">
              <span class="ck-nav__icon">◎</span> Access Requests
              @if (pendingCount > 0) {
                <span class="ck-nav__badge">{{ pendingCount }}</span>
              }
            </a>
            <a class="ck-nav__item" routerLink="/admin/tenants" routerLinkActive="is-active">
              <span class="ck-nav__icon">◈</span> Tenants
            </a>
            <a class="ck-nav__item" routerLink="/admin/users" routerLinkActive="is-active">
              <span class="ck-nav__icon">◉</span> Users
            </a>
          </div>

          <div class="ck-nav__group">
            <div class="ck-nav__group-label">Configuration</div>
            <a class="ck-nav__item" routerLink="/admin/platform" routerLinkActive="is-active">
              <span class="ck-nav__icon">⊙</span> Platform Settings
            </a>
          </div>

          <div class="ck-nav__group">
            <div class="ck-nav__group-label">Navigate</div>
            <a class="ck-nav__item" routerLink="/app/dashboard">
              <span class="ck-nav__icon">←</span> Back to Workspace
            </a>
          </div>
        </nav>

        <!-- User footer -->
        <div class="ck-sidebar-footer">
          <div class="ck-user-pill">
            <span class="ck-user-pill__avatar ck-auto-030">
              {{ userInitial }}
            </span>
            <div class="ck-user-pill__info">
              <div class="ck-user-pill__email">{{ session.user()?.email }}</div>
              <div class="ck-user-pill__role">superadmin</div>
            </div>
            <button class="ck-user-pill__btn" (click)="logout()" title="Sign out">⎋</button>
          </div>
        </div>
      </aside>

      <!-- MAIN -->
      <main class="ck-main">
        <header class="ck-appbar ck-appbar--admin">
          <div class="ck-appbar__meta">
            <p class="ck-appbar__eyebrow">{{ shellModeLabel }}</p>
            <div class="ck-appbar__breadcrumb">
              <span>{{ shellSection }}</span>
              <span>›</span>
              <strong>{{ shellTitle }}</strong>
            </div>
          </div>
          <div class="ck-appbar__actions">
            <span class="ck-badge ck-badge--danger">Superadmin</span>
            <span class="ck-badge ck-badge--default">Platform Control</span>
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
export class AdminShellComponent implements OnInit {
  pendingCount = 0;

  get userInitial(): string {
    return (this.session.user()?.email ?? "A").charAt(0).toUpperCase();
  }

  constructor(
    readonly session: SessionStore,
    private readonly router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    await this.session.ensureLoaded();
    if (!this.session.user()) {
      await this.router.navigate(["/login"]);
      return;
    }
    if (this.session.user()?.platformRole !== "superadmin") {
      await this.router.navigate(["/app"]);
    }
  }

  async logout(): Promise<void> {
    await this.session.logout();
    window.location.href = "/login";
  }

  get shellModeLabel(): string {
    return "Platform Governance";
  }

  get shellSection(): string {
    return this.routeData("section", "Platform");
  }

  get shellTitle(): string {
    return this.routeData("title", "Overview");
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
