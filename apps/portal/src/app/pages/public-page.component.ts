import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, RouterModule } from "@angular/router";
import {
  DEFAULT_PORTAL_SETTINGS,
  getAlternatePublicPage,
  getPublicNavigation,
  getPublicPage,
  PublicLocale,
  PublicPageDefinition,
  PublicPageSection,
} from "../content/public-site";
import { PortalSettings, PlatformPublicResponse } from "../core/models";
import { PortalApiService } from "../core/portal-api.service";
import { SeoService } from "../services/seo.service";
import { buildPageSeo } from "../services/seo-utils";
import { MarketingFrameComponent } from "../shared/marketing-frame.component";
import { TestimonialStripComponent } from "../shared/testimonial-strip.component";

@Component({
  selector: "app-public-page",
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MarketingFrameComponent, TestimonialStripComponent],
  template: `
    <app-marketing-frame
      [locale]="locale"
      [platform]="platform"
      [navigation]="navigation"
      [alternatePath]="alternatePage.path"
      [ctaLabel]="page.primaryCtaLabel"
      [ctaPath]="page.primaryCtaPath"
    >
      <section class="page-hero" [class.page-hero--home]="page.key === 'home'" id="main-content">
        <div class="site-shell">
          <div class="breadcrumb-row" *ngIf="page.key !== 'home'">
            <a [routerLink]="locale === 'es' ? '/' : '/en'">{{ locale === "es" ? "Inicio" : "Home" }}</a>
            <span>/</span>
            <span>{{ page.breadcrumbLabel }}</span>
          </div>

          <div class="hero-surface" [class.hero-surface--home]="page.key === 'home'">
            <div class="hero-copy-pane">
              <span class="eyebrow">{{ page.heroEyebrow }}</span>
              <div class="badge-row">
                <span class="badge" *ngFor="let badge of page.heroBadges">{{ badge }}</span>
              </div>
              <h1>{{ page.heroTitle }}</h1>
              <p class="hero-copy">{{ page.heroCopy }}</p>
              <p class="hero-summary">{{ page.heroSummary }}</p>

              <div class="hero-actions">
                <a class="button button-primary" [routerLink]="page.primaryCtaPath">{{ page.primaryCtaLabel }}</a>
                <a class="button button-secondary" [routerLink]="page.secondaryCtaPath">{{ page.secondaryCtaLabel }}</a>
              </div>

              <div class="hero-stat-grid">
                <article class="stat-card" *ngFor="let stat of page.heroStats">
                  <strong>{{ stat.value }}</strong>
                  <span>{{ stat.label }}</span>
                  <p>{{ stat.detail }}</p>
                </article>
              </div>
            </div>

            <aside class="hero-visual" *ngIf="page.key !== 'home'">
              <img class="hero-visual__image" [src]="page.heroImage" [alt]="page.heroImageAlt" />
              <div class="hero-visual__note">
                <span class="eyebrow">{{ locale === "es" ? "Arquitectura útil" : "Useful architecture" }}</span>
                <h2>
                  {{
                    locale === "es"
                      ? "Experiencia pública, conocimiento y gobierno trabajando juntos."
                      : "Public experience, knowledge and governance working together."
                  }}
                </h2>
                <ul class="plain-list plain-list--tight">
                  <li *ngFor="let proof of page.leadInProofs">{{ proof }}</li>
                </ul>
              </div>
            </aside>

            <!-- Home: animated chat widget mockup -->
            <aside class="hero-visual hero-visual--chat" *ngIf="page.key === 'home'">
              <div class="chat-mockup">
                <div class="chat-mockup__bar">
                  <span class="chat-mockup__dot"></span>
                  <span class="chat-mockup__dot"></span>
                  <span class="chat-mockup__dot"></span>
                  <span class="chat-mockup__title">Talkaris Widget</span>
                </div>
                <div class="chat-mockup__body">
                  <div class="chat-msg chat-msg--bot chat-msg--1">
                    <div class="chat-msg__bubble">
                      {{ locale === "es" ? "¡Hola! ¿En qué puedo ayudarte hoy?" : "Hi! How can I help you today?" }}
                    </div>
                  </div>
                  <div class="chat-msg chat-msg--user chat-msg--2">
                    <div class="chat-msg__bubble">
                      {{ locale === "es" ? "¿Cómo integro el widget en mi web?" : "How do I integrate the widget on my site?" }}
                    </div>
                  </div>
                  <div class="chat-msg chat-msg--bot chat-msg--3">
                    <div class="chat-msg__bubble">
                      {{ locale === "es" ? "Con un snippet de una línea y tu site key. Menos de 5 minutos." : "With a one-line snippet and your site key. Under 5 minutes." }}
                    </div>
                  </div>
                  <div class="chat-msg chat-msg--user chat-msg--4">
                    <div class="chat-msg__bubble">
                      {{ locale === "es" ? "¿Qué modelos LLM soporta?" : "Which LLM models are supported?" }}
                    </div>
                  </div>
                </div>
                <div class="chat-mockup__footer">
                  <span class="chat-mockup__powered">Powered by Talkaris</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section class="lead-in-section">
        <div class="site-shell lead-in-panel">
          <div>
            <span class="eyebrow">{{ locale === "es" ? "Por qué ahora" : "Why now" }}</span>
            <h2>{{ page.leadInTitle }}</h2>
            <p>{{ page.leadInBody }}</p>
          </div>
          <div class="proof-list">
            <article class="proof-item" *ngFor="let proof of page.leadInProofs">
              <span class="proof-item__dot"></span>
              <p>{{ proof }}</p>
            </article>
          </div>
        </div>
      </section>

      <ng-container *ngFor="let section of page.sections">
        <!-- Insert testimonial strip before pricing-teaser on home -->
        <app-testimonial-strip *ngIf="page.key === 'home' && section.id === 'pricing-teaser'" [locale]="locale"></app-testimonial-strip>

        <!-- Testimonials section type -->
        <section *ngIf="section.type === 'testimonials'" class="content-section testimonials-section" [attr.id]="section.id">
          <div class="site-shell">
            <div class="section-heading">
              <span class="eyebrow">{{ section.eyebrow }}</span>
              <h2>{{ section.title }}</h2>
              <p>{{ section.intro }}</p>
            </div>
            <div class="testimonials-grid">
              <article class="testimonial-card" *ngFor="let card of section.cards">
                <div class="testimonial-card__quote">&ldquo;{{ card.body }}&rdquo;</div>
                <div class="testimonial-card__author">
                  <strong>{{ card.authorName }}</strong>
                  <span>{{ card.authorRole }}</span>
                  <span class="testimonial-card__company">{{ card.authorCompany }}</span>
                </div>
              </article>
            </div>
          </div>
        </section>

        <!-- Logos section type -->
        <section *ngIf="section.type === 'logos'" class="content-section logos-section" [attr.id]="section.id">
          <div class="site-shell">
            <div class="section-heading">
              <span class="eyebrow">{{ section.eyebrow }}</span>
              <h2>{{ section.title }}</h2>
            </div>
            <div class="logos-grid">
              <span class="logo-item" *ngFor="let card of section.cards">{{ card.title }}</span>
            </div>
          </div>
        </section>

        <!-- Numbered section type -->
        <section *ngIf="section.type === 'numbered'" class="content-section" [attr.id]="section.id">
          <div class="site-shell">
            <div class="section-heading">
              <span class="eyebrow">{{ section.eyebrow }}</span>
              <h2>{{ section.title }}</h2>
              <p>{{ section.intro }}</p>
            </div>
            <div class="numbered-grid" [ngClass]="gridClass(section)">
              <article class="numbered-card" *ngFor="let card of section.cards; let idx = index">
                <span class="numbered-card__num">{{ (idx + 1).toString().padStart(2, '0') }}</span>
                <h3>{{ card.title }}</h3>
                <p>{{ card.body }}</p>
              </article>
            </div>
          </div>
        </section>

        <!-- Default cards section (no type or type === 'cards' or type === 'comparison') -->
        <section *ngIf="!section.type || section.type === 'cards' || section.type === 'comparison'" class="content-section" [attr.id]="section.id">
          <div class="site-shell">
            <div class="section-heading">
              <span class="eyebrow">{{ section.eyebrow }}</span>
              <h2>{{ section.title }}</h2>
              <p>{{ section.intro }}</p>
            </div>

            <div class="section-layout" [ngClass]="section.layout">
              <div class="section-layout__image" *ngIf="section.image">
                <img [src]="section.image" [alt]="section.imageAlt || section.title" loading="lazy" />
              </div>

              <div class="content-grid" [ngClass]="gridClass(section)">
                <article class="feature-card" *ngFor="let card of section.cards">
                  <span class="feature-card__metric" *ngIf="card.metric">{{ card.metric }}</span>
                  <span class="feature-card__eyebrow" *ngIf="card.eyebrow">{{ card.eyebrow }}</span>
                  <h3>{{ card.title }}</h3>
                  <p>{{ card.body }}</p>
                  <ul class="plain-list plain-list--tight" *ngIf="card.bullets?.length">
                    <li *ngFor="let bullet of card.bullets">{{ bullet }}</li>
                  </ul>
                </article>
              </div>
            </div>
          </div>
        </section>
      </ng-container>

      <!-- Inline demo form (home only) -->
      <section class="inline-demo-section" *ngIf="page.key === 'home'">
        <div class="site-shell">
          <div class="inline-demo-panel">
            <div class="inline-demo-panel__copy">
              <span class="eyebrow">{{ locale === "es" ? "Demo rápida" : "Quick demo" }}</span>
              <h2>{{ locale === "es" ? "Solicita tu demo en 30 segundos." : "Request your demo in 30 seconds." }}</h2>
              <p>{{ locale === "es" ? "Sin permanencia. Sin compromiso. Si hay fit, estás en producción en 48h." : "No lock-in. No commitment. If there is fit, you are live in 48h." }}</p>
            </div>
            <div class="inline-demo-panel__form">
              <div class="ck-alert ck-alert--success" *ngIf="inlineDemoSuccess">
                {{ locale === "es" ? "¡Solicitud enviada! Te contactaremos pronto." : "Request sent! We will be in touch soon." }}
              </div>
              <div class="ck-alert ck-alert--danger" *ngIf="inlineDemoError">
                {{ locale === "es" ? "Error al enviar. Inténtalo de nuevo." : "Error sending. Please try again." }}
              </div>
              <form class="inline-demo-form ck-form-stack" (ngSubmit)="submitInlineDemo()" *ngIf="!inlineDemoSuccess">
                <div class="ck-field">
                  <label class="ck-label" for="inline-demo-email">{{ locale === "es" ? "Email corporativo" : "Work email" }}</label>
                  <input
                    id="inline-demo-email"
                    class="ck-input"
                    [(ngModel)]="inlineDemoForm.email"
                    name="inline-email"
                    type="email"
                    required
                    [placeholder]="locale === 'es' ? 'tu@empresa.com' : 'you@company.com'"
                  />
                </div>
                <div class="ck-field">
                  <label class="ck-label" for="inline-demo-company">{{ locale === "es" ? "Empresa" : "Company" }}</label>
                  <input
                    id="inline-demo-company"
                    class="ck-input"
                    [(ngModel)]="inlineDemoForm.company"
                    name="inline-company"
                    required
                    [placeholder]="locale === 'es' ? 'Nombre de empresa' : 'Company name'"
                  />
                </div>
                <button class="ck-btn ck-btn--primary ck-btn--fill" type="submit" [disabled]="inlineDemoSubmitting">
                  {{ inlineDemoSubmitting ? (locale === "es" ? "Enviando..." : "Sending...") : (locale === "es" ? "Solicitar demo rápida" : "Request quick demo") }}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section class="timeline-section" *ngIf="page.timeline?.length">
        <div class="site-shell">
          <div class="section-heading">
            <span class="eyebrow">{{ locale === "es" ? "Proceso" : "Process" }}</span>
            <h2>{{ page.timelineTitle }}</h2>
            <p>{{ page.timelineIntro }}</p>
          </div>

          <div class="timeline-grid">
            <article class="timeline-card" *ngFor="let step of page.timeline">
              <span class="timeline-card__step">{{ step.step }}</span>
              <h3>{{ step.title }}</h3>
              <p>{{ step.body }}</p>
            </article>
          </div>
        </div>
      </section>

      <section class="faq-section" *ngIf="page.faqs?.length">
        <div class="site-shell">
          <div class="section-heading">
            <span class="eyebrow">FAQ</span>
            <h2>
              {{
                locale === "es"
                  ? "Preguntas frecuentes que ayudan a decidir mejor."
                  : "Frequently asked questions that help decisions move faster."
              }}
            </h2>
            <p>
              {{
                locale === "es"
                  ? "Esta sección responde dudas reales de implantación, encaje y operación."
                  : "This section answers real questions about fit, deployment and operations."
              }}
            </p>
          </div>

          <div class="faq-grid">
            <article class="faq-card" *ngFor="let item of page.faqs">
              <h3>{{ item.question }}</h3>
              <p>{{ item.answer }}</p>
            </article>
          </div>
        </div>
      </section>

      <section class="cta-section">
        <div class="site-shell cta-panel">
          <div>
            <span class="eyebrow">{{ page.ctaPanel.eyebrow }}</span>
            <h2>{{ page.ctaPanel.title }}</h2>
            <p>{{ page.ctaPanel.body }}</p>
          </div>
          <div class="hero-actions">
            <a class="button button-primary" [routerLink]="page.ctaPanel.primaryPath">{{ page.ctaPanel.primaryLabel }}</a>
            <a class="button button-secondary" [routerLink]="page.ctaPanel.secondaryPath">
              {{ page.ctaPanel.secondaryLabel }}
            </a>
          </div>
        </div>
      </section>
    </app-marketing-frame>
  `})
export class PublicPageComponent implements OnInit {
  locale: PublicLocale = "es";
  page!: PublicPageDefinition;
  alternatePage!: PublicPageDefinition;
  navigation: PublicPageDefinition[] = [];
  platform: PortalSettings = DEFAULT_PORTAL_SETTINGS;
  publicData: PlatformPublicResponse | null = null;

  inlineDemoForm = { email: "", company: "" };
  inlineDemoSubmitting = false;
  inlineDemoSuccess = false;
  inlineDemoError = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly api: PortalApiService,
    private readonly seo: SeoService
  ) {}

  async ngOnInit(): Promise<void> {
    const locale = this.route.snapshot.data["locale"] as PublicLocale;
    const pageKey = this.route.snapshot.data["pageKey"] as string;
    this.locale = locale;
    this.page = getPublicPage(pageKey as import("../content/public-site").PublicPageKey, locale);
    this.alternatePage = getAlternatePublicPage(this.page, locale === "es" ? "en" : "es");
    this.navigation = getPublicNavigation(locale);
    this.applySeo();

    try {
      this.publicData = await this.api.publicPlatform();
      this.platform = this.publicData.platform;
    } catch {
      this.platform = DEFAULT_PORTAL_SETTINGS;
    }

    this.applySeo();
  }

  gridClass(section: PublicPageSection): string {
    switch (section.layout) {
      case "two-up":
        return "content-grid--two";
      case "spotlight":
        return "content-grid--spotlight";
      default:
        return "content-grid--three";
    }
  }

  async submitInlineDemo(): Promise<void> {
    if (!this.inlineDemoForm.email || !this.inlineDemoForm.company) return;
    this.inlineDemoSubmitting = true;
    this.inlineDemoError = false;
    try {
      await this.api.submitAccessRequest({
        name: "",
        email: this.inlineDemoForm.email,
        company: this.inlineDemoForm.company,
        phone: "",
        requestedTenantName: this.inlineDemoForm.company,
        message: "",
      });
      this.inlineDemoSuccess = true;
    } catch {
      this.inlineDemoError = true;
    } finally {
      this.inlineDemoSubmitting = false;
    }
  }

  private applySeo(): void {
    this.seo.update(buildPageSeo(this.page, this.platform, this.platform.portalBaseUrl));
  }
}
