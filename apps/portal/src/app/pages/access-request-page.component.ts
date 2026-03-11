import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { RouterModule } from "@angular/router";
import { DEFAULT_PORTAL_SETTINGS } from "../content/public-site";
import { PortalApiService } from "../core/portal-api.service";
import { SeoService } from "../services/seo.service";
import { buildNoIndexSeo } from "../services/seo-utils";

@Component({
  selector: "app-access-request-page",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <section class="page-shell">
      <div class="site-shell split-layout">
        <article class="surface-card pitch-card">
          <span class="eyebrow">{{ copy.eyebrow }}</span>
          <h1>{{ copy.title }}</h1>
          <p>
            {{ copy.summary }}
          </p>
          <ul class="plain-list">
            @for (item of copy.bullets; track item) {
              <li>{{ item }}</li>
            }
          </ul>
          <a class="plain-link" [routerLink]="copy.backPath">{{ copy.backLabel }}</a>
        </article>

        <article class="surface-card form-card">
          <h2>{{ copy.formTitle }}</h2>

          @if (successMessage) {
            <div class="alert alert-success">{{ successMessage }}</div>
          }

          @if (errorMessage) {
            <div class="alert alert-error">{{ errorMessage }}</div>
          }

          <form class="stack-form" (ngSubmit)="submit()">
            <label>
              <span>{{ copy.nameLabel }}</span>
              <input [(ngModel)]="form.name" name="name" required />
            </label>

            <label>
              <span>{{ copy.companyLabel }}</span>
              <input [(ngModel)]="form.company" name="company" required />
            </label>

            <label>
              <span>{{ copy.emailLabel }}</span>
              <input [(ngModel)]="form.email" name="email" type="email" required />
            </label>

            <label>
              <span>{{ copy.phoneLabel }}</span>
              <input [(ngModel)]="form.phone" name="phone" />
            </label>

            <label>
              <span>{{ copy.tenantLabel }}</span>
              <input [(ngModel)]="form.requestedTenantName" name="requestedTenantName" />
            </label>

            <label>
              <span>{{ copy.contextLabel }}</span>
              <textarea [(ngModel)]="form.message" name="message" rows="5"></textarea>
            </label>

            <button class="button button-primary" type="submit" [disabled]="submitting">
              {{ submitting ? copy.submitting : copy.submit }}
            </button>
          </form>
        </article>
      </div>
    </section>
  `,
})
export class AccessRequestPageComponent implements OnInit {
  locale: "es" | "en" = "es";
  submitting = false;
  successMessage = "";
  errorMessage = "";
  copy: AccessRequestCopy = ACCESS_REQUEST_COPY.es;
  form = {
    name: "",
    company: "",
    email: "",
    phone: "",
    requestedTenantName: "",
    message: "",
  };

  constructor(
    private readonly api: PortalApiService,
    private readonly route: ActivatedRoute,
    private readonly seo: SeoService
  ) {}

  ngOnInit(): void {
    this.locale = (this.route.snapshot.data["locale"] as "es" | "en" | undefined) ?? "es";
    this.copy = ACCESS_REQUEST_COPY[this.locale];
    this.seo.update(
      buildNoIndexSeo(
        this.copy.seoTitle,
        this.copy.seoDescription,
        this.copy.path,
        this.locale,
        DEFAULT_PORTAL_SETTINGS,
        DEFAULT_PORTAL_SETTINGS.portalBaseUrl
      )
    );
  }

  async submit(): Promise<void> {
    this.submitting = true;
    this.successMessage = "";
    this.errorMessage = "";

    try {
      await this.api.submitAccessRequest({
        ...this.form,
        requestedTenantName: this.form.requestedTenantName || this.form.company,
      });
      this.successMessage = this.copy.successMessage;
      this.form = {
        name: "",
        company: "",
        email: "",
        phone: "",
        requestedTenantName: "",
        message: "",
      };
    } catch {
      this.errorMessage = this.copy.errorMessage;
    } finally {
      this.submitting = false;
    }
  }
}

type AccessRequestCopy = {
  eyebrow: string;
  title: string;
  summary: string;
  bullets: string[];
  backLabel: string;
  backPath: string;
  formTitle: string;
  nameLabel: string;
  companyLabel: string;
  emailLabel: string;
  phoneLabel: string;
  tenantLabel: string;
  contextLabel: string;
  submit: string;
  submitting: string;
  successMessage: string;
  errorMessage: string;
  seoTitle: string;
  seoDescription: string;
  path: string;
};

const ACCESS_REQUEST_COPY: Record<"es" | "en", AccessRequestCopy> = {
  es: {
    eyebrow: "Acceso revisado",
    title: "Solicitar acceso a Talkaris",
    summary: "El alta es pública, pero la aprobación la controla superadmin para mantener aislamiento por tenant y gobierno centralizado.",
    bullets: [
      "Se revisa el tenant solicitado y el contexto de uso.",
      "La aprobación crea el espacio inicial y el admin del tenant.",
      "La activación final se completa mediante enlace de alta o reset.",
    ],
    backLabel: "Volver a la landing",
    backPath: "/",
    formTitle: "Formulario de acceso",
    nameLabel: "Nombre",
    companyLabel: "Empresa",
    emailLabel: "Email corporativo",
    phoneLabel: "Teléfono",
    tenantLabel: "Nombre del tenant solicitado",
    contextLabel: "Contexto",
    submit: "Enviar solicitud",
    submitting: "Enviando...",
    successMessage: "Solicitud enviada. El equipo revisará el tenant y el acceso inicial.",
    errorMessage: "No se pudo registrar la solicitud. Revisa los datos e inténtalo de nuevo.",
    seoTitle: "Solicitar acceso",
    seoDescription: "Formulario de acceso revisado para Talkaris.",
    path: "/solicitar-acceso",
  },
  en: {
    eyebrow: "Reviewed access",
    title: "Request access to Talkaris",
    summary: "Sign-up is public, but approval is controlled by superadmin to preserve tenant isolation and central governance.",
    bullets: [
      "The requested tenant and use case are reviewed first.",
      "Approval creates the initial workspace and tenant admin.",
      "Final activation happens through the access or reset link.",
    ],
    backLabel: "Back to home",
    backPath: "/en",
    formTitle: "Access request form",
    nameLabel: "Name",
    companyLabel: "Company",
    emailLabel: "Work email",
    phoneLabel: "Phone",
    tenantLabel: "Requested tenant name",
    contextLabel: "Context",
    submit: "Send request",
    submitting: "Sending...",
    successMessage: "Request submitted. The team will review the tenant and initial access.",
    errorMessage: "The request could not be submitted. Review the data and try again.",
    seoTitle: "Request access",
    seoDescription: "Reviewed access form for Talkaris.",
    path: "/en/request-access",
  },
};
