import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, RouterModule } from "@angular/router";
import {
  DEFAULT_PORTAL_SETTINGS,
  getAlternatePublicPage,
  getPublicNavigation,
  getPublicPage,
  PublicLocale,
  PublicPageDefinition,
  PublicPageKey,
  PublicPageSection,
} from "../content/public-site";
import { PortalSettings, PlatformPublicResponse } from "../core/models";
import { PortalApiService } from "../core/portal-api.service";
import { SeoService } from "../services/seo.service";
import { buildPageSeo } from "../services/seo-utils";
import { MarketingFrameComponent } from "../shared/marketing-frame.component";

@Component({
  selector: "app-public-page",
  standalone: true,
  imports: [CommonModule, RouterModule, MarketingFrameComponent],
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

            <aside class="hero-visual">
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

      <section class="content-section" *ngFor="let section of page.sections" [attr.id]="section.id">
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
  `,
})
export class PublicPageComponent implements OnInit {
  locale: PublicLocale = "es";
  page!: PublicPageDefinition;
  alternatePage!: PublicPageDefinition;
  navigation: PublicPageDefinition[] = [];
  platform: PortalSettings = DEFAULT_PORTAL_SETTINGS;
  publicData: PlatformPublicResponse | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly api: PortalApiService,
    private readonly seo: SeoService
  ) {}

  async ngOnInit(): Promise<void> {
    const locale = this.route.snapshot.data["locale"] as PublicLocale;
    const pageKey = this.route.snapshot.data["pageKey"] as PublicPageKey;
    this.locale = locale;
    this.page = getPublicPage(pageKey, locale);
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

  private applySeo(): void {
    this.seo.update(buildPageSeo(this.page, this.platform, this.platform.portalBaseUrl));
  }
}
