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
    <section class="page-shell">
      <div class="site-shell split-layout">
        <article class="surface-card pitch-card">
          <span class="eyebrow">Password reset</span>
          <h1>{{ token ? "Definir nueva password" : "Solicitar enlace de acceso" }}</h1>
          <p>
            El mismo flujo sirve para activar una cuenta aprobada o para restablecer credenciales ya existentes.
          </p>
          <a class="plain-link" routerLink="/login">Volver al login</a>
        </article>

        <article class="surface-card form-card">
          @if (successMessage) {
            <div class="alert alert-success">{{ successMessage }}</div>
          }

          @if (errorMessage) {
            <div class="alert alert-error">{{ errorMessage }}</div>
          }

          @if (token) {
            <form class="stack-form" (ngSubmit)="resetPassword()">
              <label>
                <span>Nueva password</span>
                <input [(ngModel)]="password" name="password" type="password" required />
              </label>
              <button class="button button-primary" type="submit" [disabled]="loading">
                {{ loading ? "Guardando..." : "Activar acceso" }}
              </button>
            </form>
          } @else {
            <form class="stack-form" (ngSubmit)="requestReset()">
              <label>
                <span>Email</span>
                <input [(ngModel)]="email" name="email" type="email" required />
              </label>
              <button class="button button-primary" type="submit" [disabled]="loading">
                {{ loading ? "Enviando..." : "Solicitar enlace" }}
              </button>
            </form>
          }
        </article>
      </div>
    </section>
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
