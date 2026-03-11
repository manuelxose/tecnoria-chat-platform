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
    <section class="page-shell">
      <div class="site-shell split-layout">
        <article class="surface-card pitch-card">
          <span class="eyebrow">Portal privado</span>
          <h1>Entrar a Talkaris</h1>
          <p>
            Usa tus credenciales para administrar tenants, proyectos, integraciones, analítica y operaciones desde el portal de Talkaris.
          </p>
          <div class="inline-links">
            <a class="plain-link" routerLink="/reset-password">Recuperar acceso</a>
            <a class="plain-link" routerLink="/solicitar-acceso">Solicitar acceso</a>
          </div>
        </article>

        <article class="surface-card form-card">
          <h2>Login</h2>

          @if (errorMessage) {
            <div class="alert alert-error">{{ errorMessage }}</div>
          }

          <form class="stack-form" (ngSubmit)="submit()">
            <label>
              <span>Email</span>
              <input [(ngModel)]="email" name="email" type="email" required />
            </label>

            <label>
              <span>Password</span>
              <input [(ngModel)]="password" name="password" type="password" required />
            </label>

            <button class="button button-primary" type="submit" [disabled]="loading">
              {{ loading ? "Validando..." : "Entrar" }}
            </button>
          </form>
        </article>
      </div>
    </section>
  `,
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
      this.errorMessage = "No se pudo iniciar sesion. Revisa email y password.";
    } finally {
      this.loading = false;
    }
  }
}
