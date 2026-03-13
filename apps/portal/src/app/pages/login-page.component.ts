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
    <div class="login-shell">
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

          <div class="alert alert-error" *ngIf="errorMessage">{{ errorMessage }}</div>

          <form class="stack-form" (ngSubmit)="submit()">
            <label>
              <span>Email</span>
              <input
                [(ngModel)]="email"
                name="email"
                type="email"
                required
                autocomplete="email"
                placeholder="tu@empresa.com"
              />
            </label>

            <label>
              <span>Contraseña</span>
              <input
                [(ngModel)]="password"
                name="password"
                type="password"
                required
                autocomplete="current-password"
                placeholder="••••••••"
              />
            </label>

            <button class="button button-primary button-primary--block" type="submit" [disabled]="loading">
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
                <span class="login-mockup__dot login-mockup__dot--green"></span>
                <span>Widget activo en 3 dominios</span>
              </div>
              <div class="login-mockup__row">
                <span class="login-mockup__dot login-mockup__dot--green"></span>
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
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }
    .login-shell {
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: 100vh;
    }
    .login-panel {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 3rem 2rem;
      gap: 2rem;
      background: var(--paper);
    }
    .login-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      align-self: flex-start;
      max-width: 400px;
      width: 100%;
    }
    .login-brand__logo {
      font-size: 1.1rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--brand);
    }
    .login-brand__tag {
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: color-mix(in srgb, var(--ink) 40%, transparent);
      background: color-mix(in srgb, var(--ink) 7%, transparent);
      padding: 0.2rem 0.5rem;
      border-radius: 999px;
    }
    .login-card {
      width: 100%;
      max-width: 400px;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .login-card__header h1 {
      font-size: 1.75rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      margin-bottom: 0.375rem;
    }
    .login-card__header p {
      font-size: 0.9rem;
      color: color-mix(in srgb, var(--ink) 55%, transparent);
      line-height: 1.5;
    }
    .login-card__footer {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
    }
    .login-card__sep {
      color: color-mix(in srgb, var(--ink) 25%, transparent);
    }
    .login-proofs {
      display: flex;
      gap: 1.25rem;
      flex-wrap: wrap;
      align-self: flex-start;
      max-width: 400px;
      width: 100%;
    }
    .login-proofs span {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: color-mix(in srgb, var(--ink) 30%, transparent);
    }
    /* Aside */
    .login-aside {
      background: color-mix(in srgb, var(--brand) 6%, var(--paper));
      border-left: 1px solid color-mix(in srgb, var(--ink) 8%, transparent);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem 2.5rem;
    }
    .login-aside__inner {
      max-width: 380px;
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    .login-aside__label .eyebrow {
      display: block;
      margin-bottom: 0.5rem;
    }
    .login-aside__label p {
      font-size: 1rem;
      line-height: 1.6;
      color: color-mix(in srgb, var(--ink) 65%, transparent);
    }
    .login-mockup {
      border: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
      border-radius: 0.75rem;
      overflow: hidden;
      background: var(--paper);
      box-shadow: 0 4px 24px color-mix(in srgb, var(--ink) 6%, transparent);
    }
    .login-mockup__bar {
      display: flex;
      gap: 0.375rem;
      align-items: center;
      padding: 0.625rem 0.875rem;
      border-bottom: 1px solid color-mix(in srgb, var(--ink) 8%, transparent);
      background: color-mix(in srgb, var(--ink) 3%, transparent);
    }
    .login-mockup__bar span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: color-mix(in srgb, var(--ink) 18%, transparent);
    }
    .login-mockup__content {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }
    .login-mockup__stat {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }
    .login-mockup__stat strong {
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--brand);
    }
    .login-mockup__stat span {
      font-size: 0.75rem;
      color: color-mix(in srgb, var(--ink) 50%, transparent);
    }
    .login-mockup__divider {
      height: 1px;
      background: color-mix(in srgb, var(--ink) 8%, transparent);
      margin: 0.25rem 0;
    }
    .login-mockup__row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      color: color-mix(in srgb, var(--ink) 65%, transparent);
    }
    .login-mockup__dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .login-mockup__dot--green { background: #22c55e; }
    .login-mockup__dot--amber { background: #f59e0b; }
    /* Responsive */
    @media (max-width: 768px) {
      .login-shell {
        grid-template-columns: 1fr;
      }
      .login-aside {
        display: none;
      }
      .login-panel {
        padding: 2rem 1.5rem;
      }
    }
  `],
})
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
