import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { DEFAULT_PORTAL_SETTINGS, getPublicNavigation, PublicLocale } from "../content/public-site";
import { PortalApiService } from "../core/portal-api.service";
import { buildNoIndexSeo } from "../services/seo-utils";
import { SeoService } from "../services/seo.service";
import { MarketingFrameComponent } from "../shared/marketing-frame.component";

@Component({
  selector: "app-access-request-page",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MarketingFrameComponent],
  template: `
    <app-marketing-frame
      [locale]="locale"
      [platform]="platform"
      [navigation]="navigation"
      [alternatePath]="copy.alternatePath"
      [ctaLabel]="copy.ctaLabel"
      [ctaPath]="copy.path"
    >
      <section class="page-hero page-hero--compact" id="main-content">
        <div class="site-shell split-panel">
          <article class="form-pitch-card">
            <span class="eyebrow">{{ copy.eyebrow }}</span>
            <h1>{{ copy.title }}</h1>
            <p class="hero-copy">{{ copy.summary }}</p>
            <p class="hero-summary">{{ copy.detail }}</p>

            <div class="hero-stat-grid hero-stat-grid--compact">
              <article class="stat-card" *ngFor="let item of copy.proofs">
                <strong>{{ item.value }}</strong>
                <span>{{ item.label }}</span>
                <p>{{ item.detail }}</p>
              </article>
            </div>

            <!-- What the demo includes -->
            <div class="demo-includes">
              <span class="eyebrow">{{ copy.includesEyebrow }}</span>
              <h2>{{ copy.includesTitle }}</h2>
              <ul class="demo-checklist">
                <li *ngFor="let item of copy.includesItems">
                  <span class="demo-checklist__check">✓</span>
                  {{ item }}
                </li>
              </ul>
            </div>

            <!-- Why request the demo -->
            <div class="demo-why">
              <span class="eyebrow">{{ copy.whyEyebrow }}</span>
              <div class="demo-why__items">
                <p *ngFor="let item of copy.whyItems">{{ item }}</p>
              </div>
            </div>

            <div class="section-heading section-heading--inline">
              <span class="eyebrow">{{ copy.processEyebrow }}</span>
              <h2>{{ copy.processTitle }}</h2>
            </div>
            <div class="timeline-grid timeline-grid--compact">
              <article class="timeline-card" *ngFor="let step of copy.steps">
                <span class="timeline-card__step">{{ step.step }}</span>
                <h3>{{ step.title }}</h3>
                <p>{{ step.body }}</p>
              </article>
            </div>
          </article>

          <article class="form-shell">
            <div class="form-shell__header">
              <span class="eyebrow">{{ copy.formEyebrow }}</span>
              <h2>{{ copy.formTitle }}</h2>
              <p>{{ copy.formSummary }}</p>
            </div>

            <div class="ck-alert ck-alert--success" *ngIf="successMessage">{{ successMessage }}</div>
            <div class="ck-alert ck-alert--danger" *ngIf="errorMessage">{{ errorMessage }}</div>

            <form class="ck-form-stack" (ngSubmit)="submit()">
              <div class="form-grid">
                <div class="ck-field">
                  <label class="ck-label" for="access-name">{{ copy.nameLabel }}</label>
                  <input id="access-name" class="ck-input" [(ngModel)]="form.name" name="name" required autocomplete="name" />
                </div>

                <div class="ck-field">
                  <label class="ck-label" for="access-company">{{ copy.companyLabel }}</label>
                  <input id="access-company" class="ck-input" [(ngModel)]="form.company" name="company" required autocomplete="organization" />
                </div>
              </div>

              <div class="form-grid">
                <div class="ck-field">
                  <label class="ck-label" for="access-email">{{ copy.emailLabel }}</label>
                  <input id="access-email" class="ck-input" [(ngModel)]="form.email" name="email" type="email" required autocomplete="email" />
                </div>

                <div class="ck-field">
                  <label class="ck-label" for="access-phone">{{ copy.phoneLabel }}</label>
                  <input id="access-phone" class="ck-input" [(ngModel)]="form.phone" name="phone" autocomplete="tel" />
                </div>
              </div>

              <div class="ck-field">
                <label class="ck-label" for="access-tenant">{{ copy.tenantLabel }}</label>
                <input id="access-tenant" class="ck-input" [(ngModel)]="form.requestedTenantName" name="requestedTenantName" />
              </div>

              <div class="ck-field">
                <label class="ck-label" for="access-context">{{ copy.contextLabel }}</label>
                <textarea id="access-context" class="ck-textarea" [(ngModel)]="form.message" name="message" rows="6"></textarea>
              </div>

              <div class="form-shell__footnote">
                <span>{{ copy.note }}</span>
              </div>

              <button class="ck-btn ck-btn--primary ck-btn--fill" type="submit" [disabled]="submitting">
                {{ submitting ? copy.submitting : copy.submit }}
              </button>
            </form>
          </article>
        </div>
      </section>
    </app-marketing-frame>
  `,
})
export class AccessRequestPageComponent implements OnInit {
  locale: PublicLocale = "es";
  navigation = getPublicNavigation("es");
  platform = DEFAULT_PORTAL_SETTINGS;
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
    this.locale = (this.route.snapshot.data["locale"] as PublicLocale | undefined) ?? "es";
    this.copy = ACCESS_REQUEST_COPY[this.locale];
    this.navigation = getPublicNavigation(this.locale);
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
  detail: string;
  includesEyebrow: string;
  includesTitle: string;
  includesItems: string[];
  whyEyebrow: string;
  whyItems: string[];
  processEyebrow: string;
  processTitle: string;
  formEyebrow: string;
  formTitle: string;
  formSummary: string;
  nameLabel: string;
  companyLabel: string;
  emailLabel: string;
  phoneLabel: string;
  tenantLabel: string;
  contextLabel: string;
  note: string;
  submit: string;
  submitting: string;
  successMessage: string;
  errorMessage: string;
  seoTitle: string;
  seoDescription: string;
  path: string;
  alternatePath: string;
  ctaLabel: string;
  proofs: Array<{ value: string; label: string; detail: string }>;
  steps: Array<{ step: string; title: string; body: string }>;
};

const ACCESS_REQUEST_COPY: Record<PublicLocale, AccessRequestCopy> = {
  es: {
    eyebrow: "Solicitud de demo",
    title: "Solicita una demo de Talkaris con contexto, no una llamada genérica.",
    summary:
      "Cuéntanos qué superficie quieres activar y qué necesitas resolver. La revisión está pensada para evaluar encaje real entre experiencia, contenido y operación.",
    detail:
      "No vendemos humo ni trials vacíos. Si hay fit, saldrás con una idea clara de cómo desplegar Talkaris en tu web, tu SaaS o tu circuito de soporte.",
    processEyebrow: "Qué ocurre después",
    processTitle: "Un proceso corto, consultivo y orientado a decisión.",
    formEyebrow: "Formulario",
    formTitle: "Pídenos la demo",
    formSummary:
      "Con unos pocos datos podemos enfocar la conversación hacia el caso de uso, la integración y el nivel de gobierno que necesitas.",
    nameLabel: "Nombre",
    companyLabel: "Empresa",
    emailLabel: "Email corporativo",
    phoneLabel: "Teléfono",
    tenantLabel: "Producto, equipo o área a activar",
    contextLabel: "¿Qué quieres resolver con Talkaris?",
    note: "Usaremos esta información solo para preparar la demo y evaluar el encaje operativo.",
    submit: "Solicitar demo",
    submitting: "Enviando solicitud...",
    successMessage: "Solicitud enviada. Revisaremos el caso y te contactaremos con el siguiente paso.",
    errorMessage: "No se pudo registrar la solicitud. Revisa los datos e inténtalo de nuevo.",
    seoTitle: "Solicitar demo de Talkaris",
    seoDescription: "Página de solicitud de demo de Talkaris para revisar encaje, integración y caso de uso.",
    path: "/solicitar-demo",
    alternatePath: "/en/request-demo",
    ctaLabel: "Solicitar demo",
    includesEyebrow: "Lo que incluye",
    includesTitle: "Lo que incluye la demo.",
    includesItems: [
      "Review de tu caso de uso concreto (30 min)",
      "Demo en vivo del widget en tu tipo de web",
      "Revisión de encaje técnico con tu stack",
      "Estimación de tiempo hasta producción",
      "Acceso a entorno de pruebas si hay fit",
      "Sin compromiso ni permanencia",
    ],
    whyEyebrow: "Por qué pedirla",
    whyItems: [
      "Sin permanencia mínima, cancelación en cualquier momento.",
      "Demo orientada a tu caso: no una presentación genérica.",
      "Acceso a producción en 48h si hay fit.",
    ],
    proofs: [
      {
        value: "48h",
        label: "De solicitud a entorno activo",
        detail: "Si hay fit técnico, estás en producción rápido.",
      },
      {
        value: "0€",
        label: "Coste de la demo",
        detail: "Revisar el encaje no te cuesta nada.",
      },
      {
        value: "1 snippet",
        label: "Integración completa en web",
        detail: "Sin frameworks, sin build steps, sin riesgos.",
      },
    ],
    steps: [
      {
        step: "01",
        title: "Leemos tu contexto",
        body: "Revisamos superficie, caso de uso y nivel de urgencia antes de la llamada.",
      },
      {
        step: "02",
        title: "Mostramos el producto sobre tu caso",
        body: "La demo se centra en el tipo de implantación que tendría más sentido para ti.",
      },
      {
        step: "03",
        title: "Aterrizamos siguiente paso",
        body: "Definimos si conviene avanzar y con qué alcance operativo inicial.",
      },
    ],
  },
  en: {
    eyebrow: "Demo request",
    title: "Request a Talkaris demo with context, not a generic sales call.",
    summary:
      "Tell us which surface you want to activate and what problem you need to solve. The review is designed to evaluate real fit across experience, content and operations.",
    detail:
      "We do not sell hype or empty trials. If there is fit, you will leave with a clear sense of how Talkaris should be deployed on your website, SaaS or support stack.",
    processEyebrow: "What happens next",
    processTitle: "A short consultative process focused on decision-making.",
    formEyebrow: "Form",
    formTitle: "Request your demo",
    formSummary:
      "With a few details we can focus the review on the use case, integration surface and governance level you actually need.",
    nameLabel: "Name",
    companyLabel: "Company",
    emailLabel: "Work email",
    phoneLabel: "Phone",
    tenantLabel: "Product, team or area to activate",
    contextLabel: "What do you want to solve with Talkaris?",
    note: "We will use this information only to prepare the demo and review operational fit.",
    submit: "Request demo",
    submitting: "Submitting request...",
    successMessage: "Request sent. We will review the case and contact you with the next step.",
    errorMessage: "The request could not be submitted. Review the details and try again.",
    seoTitle: "Request a Talkaris demo",
    seoDescription: "Talkaris demo request page to review fit, integration and use case.",
    path: "/en/request-demo",
    alternatePath: "/solicitar-demo",
    ctaLabel: "Request demo",
    includesEyebrow: "What is included",
    includesTitle: "What the demo includes.",
    includesItems: [
      "Review of your specific use case (30 min)",
      "Live widget demo on your type of website",
      "Technical fit review with your stack",
      "Estimated time to production",
      "Access to test environment if there is fit",
      "No commitment or lock-in",
    ],
    whyEyebrow: "Why request it",
    whyItems: [
      "No minimum commitment, cancel at any time.",
      "Demo tailored to your case: not a generic presentation.",
      "Production access in 48h if there is fit.",
    ],
    proofs: [
      {
        value: "48h",
        label: "From request to active environment",
        detail: "If there is technical fit, you are live fast.",
      },
      {
        value: "€0",
        label: "Cost of the demo",
        detail: "Reviewing the fit costs you nothing.",
      },
      {
        value: "1 snippet",
        label: "Full web integration",
        detail: "No frameworks, no build steps, no risk.",
      },
    ],
    steps: [
      {
        step: "01",
        title: "We read your context",
        body: "We review the surface, use case and urgency before the call.",
      },
      {
        step: "02",
        title: "We show the product against your scenario",
        body: "The demo is focused on the implementation pattern that makes the most sense for you.",
      },
      {
        step: "03",
        title: "We define the next step",
        body: "We decide whether it makes sense to move forward and with what initial operational scope.",
      },
    ],
  },
};
