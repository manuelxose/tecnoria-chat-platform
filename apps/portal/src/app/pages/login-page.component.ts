import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { DEFAULT_PORTAL_SETTINGS } from "../content/public-site";
import { SessionStore } from "../core/session.store";
import { SeoService } from "../services/seo.service";
import { buildNoIndexSeo } from "../services/seo-utils";

@Component({
  selector: "app-login-page",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="ck-surface--cockpit login-shell">
      <div class="login-panel">

        <div class="login-brand">
          <span class="login-brand__logo">Talkaris</span>
          <span class="login-brand__tag">Portal privado</span>
        </div>

        <div class="login-card">
          <div class="login-card__header">
            <h1>Acceder</h1>
            <p>Administra tenants, proyectos e integraciones desde el portal de Talkaris.</p>
          </div>

          <div class="ck-alert ck-alert--danger" *ngIf="errorMessage">{{ errorMessage }}</div>

          <form class="ck-form-stack auth-form" (ngSubmit)="submit()">
            <div class="ck-field">
              <label class="ck-label" for="login-email">Email</label>
              <input
                id="login-email"
                class="ck-input"
                [(ngModel)]="email"
                name="email"
                type="email"
                required
                autocomplete="email"
                placeholder="tu@empresa.com"
              />
            </div>

            <div class="ck-field">
              <label class="ck-label" for="login-password">Contraseña</label>
              <input
                id="login-password"
                class="ck-input"
                [(ngModel)]="password"
                name="password"
                type="password"
                required
                autocomplete="current-password"
                placeholder="••••••••"
              />
            </div>

            <button class="ck-btn ck-btn--primary ck-btn--fill" type="submit" [disabled]="loading">
              {{ loading ? "Validando..." : "Entrar al portal" }}
            </button>
          </form>

          <div class="login-card__footer">
            <a class="plain-link" routerLink="/reset-password">¿Olvidaste la contraseña?</a>
            <span class="login-card__sep">·</span>
            <a class="plain-link" routerLink="/solicitar-demo">Solicitar acceso</a>
          </div>
        </div>

        <div class="login-proofs">
          <span>SSR-ready</span>
          <span>Multi-LLM</span>
          <span>GDPR-friendly</span>
          <span>Zero lock-in</span>
        </div>
      </div>

      <aside class="login-aside" aria-hidden="true">
        <div class="login-aside__inner">
          <div class="login-aside__label">
            <span class="eyebrow">Panel de operaciones</span>
            <p>Gestiona el conocimiento, los canales y la analítica de cada tenant desde un único lugar.</p>
          </div>
          <div class="login-mockup">
            <div class="login-mockup__bar">
              <span></span><span></span><span></span>
            </div>
            <div class="login-mockup__content">
              <div class="login-mockup__stat">
                <strong>98.7%</strong>
                <span>Uptime últimos 30 días</span>
              </div>
              <div class="login-mockup__stat">
                <strong>4 LLMs</strong>
                <span>Activos y enrutados</span>
              </div>
              <div class="login-mockup__stat">
                <strong>&lt; 5 min</strong>
                <span>Despliegue inicial</span>
              </div>
              <div class="login-mockup__divider"></div>
              <div class="login-mockup__row">
                <span class="login-mockup__dot login-mockup__dot--indigo"></span>
                <span>Widget activo en 3 dominios</span>
              </div>
              <div class="login-mockup__row">
                <span class="login-mockup__dot login-mockup__dot--violet"></span>
                <span>Ingest completado · hace 2 min</span>
              </div>
              <div class="login-mockup__row">
                <span class="login-mockup__dot login-mockup__dot--amber"></span>
                <span>Handover pendiente · 1 sesión</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  `})
export class LoginPageComponent implements OnInit {
  email = "";
  password = "";
  loading = false;
  errorMessage = "";

  constructor(
    private readonly session: SessionStore,
    private readonly router: Router,
    private readonly seo: SeoService
  ) {}

  ngOnInit(): void {
    this.seo.update(
      buildNoIndexSeo(
        "Portal login",
        "Private login for the Talkaris tenant console and superadmin workspace.",
        "/login",
        "en",
        DEFAULT_PORTAL_SETTINGS,
        DEFAULT_PORTAL_SETTINGS.portalBaseUrl
      )
    );
  }

  async submit(): Promise<void> {
    this.loading = true;
    this.errorMessage = "";

    try {
      const user = await this.session.login(this.email, this.password);
      await this.router.navigate([user.platformRole === "superadmin" ? "/admin" : "/app"]);
    } catch {
      this.errorMessage = "No se pudo iniciar sesión. Revisa email y contraseña.";
    } finally {
      this.loading = false;
    }
  }
}
