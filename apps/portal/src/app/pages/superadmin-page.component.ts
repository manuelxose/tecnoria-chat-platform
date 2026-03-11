import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { AccessRequest, AdminOverview, PortalSettings, PortalUser, Tenant } from "../core/models";
import { PortalApiService } from "../core/portal-api.service";
import { SessionStore } from "../core/session.store";
import { DEFAULT_PORTAL_SETTINGS } from "../content/public-site";
import { SeoService } from "../services/seo.service";
import { buildNoIndexSeo } from "../services/seo-utils";

@Component({
  selector: "app-superadmin-page",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <section class="dashboard-shell">
      <div class="site-shell">
        <header class="dashboard-header surface-card">
          <div>
            <span class="eyebrow">Superadmin</span>
            <h1>Gobierno global de Talkaris</h1>
            <p>Controla branding, solicitudes, tenants, usuarios y la operativa agregada del producto.</p>
          </div>

          <div class="dashboard-header__actions">
            <a class="button button-secondary" routerLink="/app">Ir a tenant console</a>
            <button class="button button-secondary" type="button" (click)="logout()">Cerrar sesion</button>
          </div>
        </header>

        @if (overview) {
          <section class="dashboard-grid dashboard-grid--three">
            <article class="surface-card stat-card">
              <span class="eyebrow">Tenants</span>
              <strong>{{ overview.counts.tenants }}</strong>
              <p>Organizaciones o clientes operando sobre la plataforma.</p>
            </article>
            <article class="surface-card stat-card">
              <span class="eyebrow">Usuarios</span>
              <strong>{{ overview.counts.users }}</strong>
              <p>Accesos globales y memberships activos.</p>
            </article>
            <article class="surface-card stat-card">
              <span class="eyebrow">Solicitudes pendientes</span>
              <strong>{{ overview.counts.pending_requests }}</strong>
              <p>Altas publicas pendientes de revision.</p>
            </article>
          </section>
        }

        <section class="dashboard-columns">
          <article class="surface-card">
            <div class="section-head">
              <div>
                <span class="eyebrow">Branding</span>
                <h2>Platform settings</h2>
              </div>
            </div>

            <form class="stack-form" (ngSubmit)="saveSettings()">
              <div class="form-grid">
                <label>
                  <span>Brand name</span>
                  <input [(ngModel)]="settingsForm.brandName" name="brandName" />
                </label>
                <label>
                  <span>Legal name</span>
                  <input [(ngModel)]="settingsForm.legalName" name="legalName" />
                </label>
              </div>

              <div class="form-grid">
                <label>
                  <span>Support email</span>
                  <input [(ngModel)]="settingsForm.supportEmail" name="supportEmail" />
                </label>
                <label>
                  <span>Contact email</span>
                  <input [(ngModel)]="settingsForm.contactEmail" name="contactEmail" />
                </label>
              </div>

              <label>
                <span>Tagline</span>
                <input [(ngModel)]="settingsForm.tagline" name="tagline" />
              </label>

              <label>
                <span>Summary</span>
                <textarea [(ngModel)]="settingsForm.summary" name="summary" rows="4"></textarea>
              </label>

              <div class="form-grid">
                <label>
                  <span>Website URL</span>
                  <input [(ngModel)]="settingsForm.websiteUrl" name="websiteUrl" />
                </label>
                <label>
                  <span>Product domain</span>
                  <input [(ngModel)]="settingsForm.productDomain" name="productDomain" />
                </label>
              </div>

              <div class="form-grid">
                <label>
                  <span>Portal base URL</span>
                  <input [(ngModel)]="settingsForm.portalBaseUrl" name="portalBaseUrl" />
                </label>
                <label>
                  <span>API base URL</span>
                  <input [(ngModel)]="settingsForm.apiBaseUrl" name="apiBaseUrl" />
                </label>
              </div>

              <div class="form-grid">
                <label>
                  <span>Widget base URL</span>
                  <input [(ngModel)]="settingsForm.widgetBaseUrl" name="widgetBaseUrl" />
                </label>
                <label>
                  <span>Demo project key</span>
                  <input [(ngModel)]="settingsForm.demoProjectKey" name="demoProjectKey" />
                </label>
              </div>

              <div class="form-grid">
                <label>
                  <span>Demo site key</span>
                  <input [(ngModel)]="settingsForm.demoSiteKey" name="demoSiteKey" />
                </label>
                <label>
                  <span>Organization name</span>
                  <input [(ngModel)]="settingsForm.organizationName" name="organizationName" />
                </label>
              </div>

              <div class="form-grid">
                <label>
                  <span>Default locale</span>
                  <input [(ngModel)]="settingsForm.defaultLocale" name="defaultLocale" />
                </label>
                <label>
                  <span>Supported locales</span>
                  <input [(ngModel)]="settingsForm.supportedLocalesText" name="supportedLocalesText" />
                </label>
              </div>

              <label>
                <span>SEO title</span>
                <input [(ngModel)]="settingsForm.seoTitle" name="seoTitle" />
              </label>

              <label>
                <span>SEO description</span>
                <textarea [(ngModel)]="settingsForm.seoDescription" name="seoDescription" rows="3"></textarea>
              </label>

              <div class="form-grid">
                <label>
                  <span>SEO image URL</span>
                  <input [(ngModel)]="settingsForm.seoImageUrl" name="seoImageUrl" />
                </label>
                <label>
                  <span>SEO keywords</span>
                  <input [(ngModel)]="settingsForm.seoKeywordsText" name="seoKeywordsText" />
                </label>
              </div>

              <label>
                <span>Hero points</span>
                <textarea [(ngModel)]="settingsForm.heroPointsText" name="heroPointsText" rows="4"></textarea>
              </label>

              <button class="button button-primary" type="submit" [disabled]="savingSettings">
                {{ savingSettings ? "Guardando..." : "Guardar settings" }}
              </button>
            </form>
          </article>

          <article class="surface-card">
            <div class="section-head">
              <div>
                <span class="eyebrow">Solicitudes</span>
                <h2>Revision de accesos</h2>
              </div>
            </div>

            <div class="record-list">
              @for (request of accessRequests; track request.id) {
                <article class="record-card">
                  <div>
                    <strong>{{ request.company }} · {{ request.name }}</strong>
                    <span>{{ request.email }} · {{ request.status }}</span>
                  </div>
                  <div class="record-actions">
                    <button class="button button-primary" type="button" (click)="approveRequest(request)">
                      Aprobar
                    </button>
                    <button class="button button-secondary" type="button" (click)="rejectRequest(request)">
                      Rechazar
                    </button>
                  </div>
                </article>
              } @empty {
                <p class="empty-copy">No hay solicitudes pendientes o registradas.</p>
              }
            </div>
          </article>
        </section>

        <section class="dashboard-grid dashboard-grid--two">
          <article class="surface-card">
            <div class="section-head">
              <div>
                <span class="eyebrow">Tenants</span>
                <h2>Alta o actualizacion</h2>
              </div>
            </div>

            <form class="stack-form" (ngSubmit)="saveTenant()">
              <div class="form-grid">
                <label>
                  <span>Slug</span>
                  <input [(ngModel)]="tenantForm.slug" name="tenantSlug" required />
                </label>
                <label>
                  <span>Name</span>
                  <input [(ngModel)]="tenantForm.name" name="tenantName" required />
                </label>
              </div>

              <button class="button button-secondary" type="submit" [disabled]="savingTenant">
                {{ savingTenant ? "Guardando..." : "Guardar tenant" }}
              </button>
            </form>

            <div class="record-list compact-list">
              @for (tenant of tenants; track tenant.id) {
                <article class="record-card">
                  <strong>{{ tenant.name }}</strong>
                  <span>{{ tenant.slug }}</span>
                </article>
              }
            </div>
          </article>

          <article class="surface-card">
            <div class="section-head">
              <div>
                <span class="eyebrow">Usuarios</span>
                <h2>Alta y membership</h2>
              </div>
            </div>

            <form class="stack-form" (ngSubmit)="saveUser()">
              <div class="form-grid">
                <label>
                  <span>Email</span>
                  <input [(ngModel)]="userForm.email" name="userEmail" type="email" required />
                </label>
                <label>
                  <span>Display name</span>
                  <input [(ngModel)]="userForm.displayName" name="userDisplayName" />
                </label>
              </div>

              <div class="form-grid">
                <label>
                  <span>Platform role</span>
                  <select [(ngModel)]="userForm.platformRole" name="platformRole">
                    <option value="member">member</option>
                    <option value="superadmin">superadmin</option>
                  </select>
                </label>
                <label>
                  <span>Status</span>
                  <select [(ngModel)]="userForm.status" name="userStatus">
                    <option value="pending">pending</option>
                    <option value="active">active</option>
                    <option value="disabled">disabled</option>
                  </select>
                </label>
              </div>

              <label>
                <span>Password inicial</span>
                <input [(ngModel)]="userForm.password" name="userPassword" type="password" />
              </label>

              <button class="button button-secondary" type="submit" [disabled]="savingUser">
                {{ savingUser ? "Guardando..." : "Guardar usuario" }}
              </button>
            </form>

            <form class="stack-form stack-form--inline" (ngSubmit)="saveMembership()">
              <label>
                <span>Usuario</span>
                <select [(ngModel)]="membershipForm.userId" name="membershipUserId">
                  @for (user of users; track user.id) {
                    <option [value]="user.id">{{ user.email }}</option>
                  }
                </select>
              </label>
              <label>
                <span>Tenant</span>
                <select [(ngModel)]="membershipForm.tenantId" name="membershipTenantId">
                  @for (tenant of tenants; track tenant.id) {
                    <option [value]="tenant.id">{{ tenant.name }}</option>
                  }
                </select>
              </label>
              <label>
                <span>Role</span>
                <select [(ngModel)]="membershipForm.role" name="membershipRole">
                  <option value="admin">admin</option>
                  <option value="editor">editor</option>
                  <option value="viewer">viewer</option>
                </select>
              </label>
              <button class="button button-primary" type="submit" [disabled]="savingMembership">
                {{ savingMembership ? "Asignando..." : "Asignar" }}
              </button>
            </form>

            <div class="record-list compact-list">
              @for (user of users; track user.id) {
                <article class="record-card">
                  <strong>{{ user.email }}</strong>
                  <span>{{ user.platformRole }} · {{ user.status }}</span>
                </article>
              }
            </div>
          </article>
        </section>
      </div>
    </section>
  `,
})
export class SuperadminPageComponent implements OnInit {
  overview: AdminOverview | null = null;
  accessRequests: AccessRequest[] = [];
  tenants: Tenant[] = [];
  users: PortalUser[] = [];
  settings: PortalSettings | null = null;

  savingSettings = false;
  savingTenant = false;
  savingUser = false;
  savingMembership = false;

  settingsForm = {
    brandName: "",
    legalName: "",
    supportEmail: "",
    contactEmail: "",
    tagline: "",
    summary: "",
    websiteUrl: "",
    productDomain: "",
    portalBaseUrl: "",
    apiBaseUrl: "",
    widgetBaseUrl: "",
    demoProjectKey: "",
    demoSiteKey: "",
    defaultLocale: "",
    supportedLocalesText: "",
    seoTitle: "",
    seoDescription: "",
    seoKeywordsText: "",
    seoImageUrl: "",
    organizationName: "",
    heroPointsText: "",
  };

  tenantForm = {
    slug: "",
    name: "",
  };

  userForm = {
    email: "",
    displayName: "",
    platformRole: "member",
    status: "pending",
    password: "",
  };

  membershipForm = {
    tenantId: "",
    userId: "",
    role: "admin",
  };

  constructor(
    readonly session: SessionStore,
    private readonly api: PortalApiService,
    private readonly router: Router,
    private readonly seo: SeoService
  ) {}

  async ngOnInit(): Promise<void> {
    this.seo.update(
      buildNoIndexSeo(
        "Superadmin",
        "Private superadmin workspace for Talkaris governance and platform operations.",
        "/admin",
        "en",
        DEFAULT_PORTAL_SETTINGS,
        DEFAULT_PORTAL_SETTINGS.portalBaseUrl
      )
    );
    await this.session.ensureLoaded();
    if (!this.session.user()) {
      await this.router.navigate(["/login"]);
      return;
    }
    if (this.session.user()?.platformRole !== "superadmin") {
      await this.router.navigate(["/app"]);
      return;
    }
    await this.refreshAll();
  }

  async refreshAll(): Promise<void> {
    this.overview = await this.api.adminOverview();
    this.accessRequests = await this.api.adminAccessRequests();
    this.tenants = await this.api.adminTenants();
    this.users = await this.api.adminUsers();
    this.settings = await this.api.adminPlatformSettings();
    this.settingsForm = {
      brandName: this.settings.brandName,
      legalName: this.settings.legalName,
      supportEmail: this.settings.supportEmail,
      contactEmail: this.settings.contactEmail,
      tagline: this.settings.tagline,
      summary: this.settings.summary,
      websiteUrl: this.settings.websiteUrl,
      productDomain: this.settings.productDomain,
      portalBaseUrl: this.settings.portalBaseUrl,
      apiBaseUrl: this.settings.apiBaseUrl,
      widgetBaseUrl: this.settings.widgetBaseUrl,
      demoProjectKey: this.settings.demoProjectKey,
      demoSiteKey: this.settings.demoSiteKey,
      defaultLocale: this.settings.defaultLocale,
      supportedLocalesText: this.settings.supportedLocales.join(", "),
      seoTitle: this.settings.seoTitle,
      seoDescription: this.settings.seoDescription,
      seoKeywordsText: this.settings.seoKeywords.join(", "),
      seoImageUrl: this.settings.seoImageUrl,
      organizationName: this.settings.organizationName,
      heroPointsText: this.settings.heroPoints.join("\n"),
    };
    this.membershipForm.tenantId ||= this.tenants[0]?.id ?? "";
    this.membershipForm.userId ||= this.users[0]?.id ?? "";
  }

  async saveSettings(): Promise<void> {
    this.savingSettings = true;
    try {
      await this.api.updatePlatformSettings({
        brandName: this.settingsForm.brandName,
        legalName: this.settingsForm.legalName,
        supportEmail: this.settingsForm.supportEmail,
        contactEmail: this.settingsForm.contactEmail,
        tagline: this.settingsForm.tagline,
        summary: this.settingsForm.summary,
        websiteUrl: this.settingsForm.websiteUrl,
        productDomain: this.settingsForm.productDomain,
        portalBaseUrl: this.settingsForm.portalBaseUrl,
        apiBaseUrl: this.settingsForm.apiBaseUrl,
        widgetBaseUrl: this.settingsForm.widgetBaseUrl,
        demoProjectKey: this.settingsForm.demoProjectKey,
        demoSiteKey: this.settingsForm.demoSiteKey,
        defaultLocale: this.settingsForm.defaultLocale,
        supportedLocales: this.settingsForm.supportedLocalesText.split(",").map((item) => item.trim()).filter(Boolean),
        seoTitle: this.settingsForm.seoTitle,
        seoDescription: this.settingsForm.seoDescription,
        seoKeywords: this.settingsForm.seoKeywordsText.split(",").map((item) => item.trim()).filter(Boolean),
        seoImageUrl: this.settingsForm.seoImageUrl,
        organizationName: this.settingsForm.organizationName,
        heroPoints: this.settingsForm.heroPointsText.split("\n").map((item) => item.trim()).filter(Boolean),
      });
      await this.refreshAll();
    } finally {
      this.savingSettings = false;
    }
  }

  async approveRequest(request: AccessRequest): Promise<void> {
    await this.api.reviewAccessRequest(request.id, {
      decision: "accepted",
      tenantName: request.requestedTenantName,
    });
    await this.refreshAll();
  }

  async rejectRequest(request: AccessRequest): Promise<void> {
    await this.api.reviewAccessRequest(request.id, {
      decision: "rejected",
      notes: "Revisado desde superadmin.",
    });
    await this.refreshAll();
  }

  async saveTenant(): Promise<void> {
    this.savingTenant = true;
    try {
      await this.api.upsertTenant(this.tenantForm);
      this.tenantForm = { slug: "", name: "" };
      await this.refreshAll();
    } finally {
      this.savingTenant = false;
    }
  }

  async saveUser(): Promise<void> {
    this.savingUser = true;
    try {
      await this.api.upsertUser(this.userForm);
      this.userForm = {
        email: "",
        displayName: "",
        platformRole: "member",
        status: "pending",
        password: "",
      };
      await this.refreshAll();
    } finally {
      this.savingUser = false;
    }
  }

  async saveMembership(): Promise<void> {
    this.savingMembership = true;
    try {
      await this.api.upsertMembership(this.membershipForm);
      await this.refreshAll();
    } finally {
      this.savingMembership = false;
    }
  }

  async logout(): Promise<void> {
    await this.session.logout();
    window.location.href = "/login";
  }
}
