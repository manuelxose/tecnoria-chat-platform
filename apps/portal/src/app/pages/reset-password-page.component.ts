import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { DEFAULT_PORTAL_SETTINGS } from "../content/public-site";
import { PortalApiService } from "../core/portal-api.service";
import { SeoService } from "../services/seo.service";
import { buildNoIndexSeo } from "../services/seo-utils";

@Component({
  selector: "app-reset-password-page",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="ck-surface--cockpit login-shell">
      <div class="login-panel">
        <div class="login-brand">
          <span class="login-brand__logo">Talkaris</span>
          <span class="login-brand__tag">Gestión de acceso</span>
        </div>

        <div class="login-card login-card--auth">
          <div class="login-card__header">
            <h1>{{ token ? "Definir nueva contraseña" : "Solicitar enlace de acceso" }}</h1>
            <p>El mismo flujo sirve para activar una cuenta aprobada o para restablecer credenciales existentes.</p>
          </div>

          @if (successMessage) {
            <div class="ck-alert ck-alert--success">{{ successMessage }}</div>
          }

          @if (errorMessage) {
            <div class="ck-alert ck-alert--danger">{{ errorMessage }}</div>
          }

          @if (token) {
            <form class="ck-form-stack auth-form" (ngSubmit)="resetPassword()">
              <div class="ck-field">
                <label class="ck-label" for="reset-password">Nueva contraseña</label>
                <input id="reset-password" class="ck-input" [(ngModel)]="password" name="password" type="password" required />
              </div>
              <button class="ck-btn ck-btn--primary ck-btn--fill" type="submit" [disabled]="loading">
                {{ loading ? "Guardando..." : "Activar acceso" }}
              </button>
            </form>
          } @else {
            <form class="ck-form-stack auth-form" (ngSubmit)="requestReset()">
              <div class="ck-field">
                <label class="ck-label" for="reset-email">Email</label>
                <input id="reset-email" class="ck-input" [(ngModel)]="email" name="email" type="email" required />
              </div>
              <button class="ck-btn ck-btn--primary ck-btn--fill" type="submit" [disabled]="loading">
                {{ loading ? "Enviando..." : "Solicitar enlace" }}
              </button>
            </form>
          }

          <div class="login-card__footer">
            <a class="plain-link" routerLink="/login">Volver al login</a>
          </div>
        </div>

        <div class="login-proofs">
          <span>Acceso seguro</span>
          <span>Tenant-aware</span>
          <span>Operación premium</span>
          <span>Sin fricción</span>
        </div>
      </div>

      <aside class="login-aside" aria-hidden="true">
        <div class="login-aside__inner">
          <div class="login-aside__label">
            <span class="eyebrow">Flujo controlado</span>
            <p>Activa usuarios, restablece acceso y devuelve a cada operador a su workspace sin romper el contexto.</p>
          </div>
          <div class="login-mockup">
            <div class="login-mockup__bar">
              <span></span><span></span><span></span>
            </div>
            <div class="login-mockup__content">
              <div class="login-mockup__stat">
                <strong>1 enlace</strong>
                <span>Activación o recovery unificados</span>
              </div>
              <div class="login-mockup__stat">
                <strong>JWT seguro</strong>
                <span>Redirección al cockpit correcto</span>
              </div>
              <div class="login-mockup__stat">
                <strong>Operación limpia</strong>
                <span>Sin pantallas auxiliares innecesarias</span>
              </div>
              <div class="login-mockup__divider"></div>
              <div class="login-mockup__row">
                <span class="login-mockup__dot login-mockup__dot--violet"></span>
                <span>Tokens gestionados desde una sola entrada</span>
              </div>
              <div class="login-mockup__row">
                <span class="login-mockup__dot login-mockup__dot--indigo"></span>
                <span>Experiencia consistente con el portal privado</span>
              </div>
              <div class="login-mockup__row">
                <span class="login-mockup__dot login-mockup__dot--amber"></span>
                <span>Expiración y errores visibles con feedback crítico</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  `,
})
export class ResetPasswordPageComponent implements OnInit {
  token = "";
  email = "";
  password = "";
  loading = false;
  successMessage = "";
  errorMessage = "";

  constructor(
    private readonly route: ActivatedRoute,
    private readonly api: PortalApiService,
    private readonly router: Router,
    private readonly seo: SeoService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get("token") || "";
    this.seo.update(
      buildNoIndexSeo(
        "Access reset",
        "Account activation and password reset flow for Talkaris portal users.",
        "/reset-password",
        "en",
        DEFAULT_PORTAL_SETTINGS,
        DEFAULT_PORTAL_SETTINGS.portalBaseUrl
      )
    );
  }

  async requestReset(): Promise<void> {
    this.loading = true;
    this.successMessage = "";
    this.errorMessage = "";

    try {
      await this.api.requestPasswordReset(this.email);
      this.successMessage = "Si el usuario existe, se ha generado un enlace de acceso o recovery.";
    } catch {
      this.errorMessage = "No se pudo generar el enlace de acceso.";
    } finally {
      this.loading = false;
    }
  }

  async resetPassword(): Promise<void> {
    this.loading = true;
    this.successMessage = "";
    this.errorMessage = "";

    try {
      const user = await this.api.resetPassword(this.token, this.password);
      await this.router.navigate([user.platformRole === "superadmin" ? "/admin" : "/app"]);
    } catch {
      this.errorMessage = "No se pudo completar el alta o reset. El token puede haber caducado.";
    } finally {
      this.loading = false;
    }
  }
}
