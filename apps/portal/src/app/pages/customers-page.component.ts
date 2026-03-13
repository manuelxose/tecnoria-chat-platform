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
} from "../content/public-site";
import { PortalSettings, PlatformPublicResponse } from "../core/models";
import { PortalApiService } from "../core/portal-api.service";
import { SeoService } from "../services/seo.service";
import { buildPageSeo } from "../services/seo-utils";
import { MarketingFrameComponent } from "../shared/marketing-frame.component";

@Component({
  selector: "app-customers-page",
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
      <section class="page-hero" id="main-content">
        <div class="site-shell">
          <div class="breadcrumb-row">
            <a [routerLink]="locale === 'es' ? '/' : '/en'">{{ locale === "es" ? "Inicio" : "Home" }}</a>
            <span>/</span>
            <span>{{ page.breadcrumbLabel }}</span>
          </div>

          <div class="hero-surface">
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
            </aside>
          </div>
        </div>
      </section>

      <!-- Case studies -->
      <section class="content-section" *ngFor="let section of page.sections; let i = index" [attr.id]="section.id">
        <div class="site-shell">
          <div class="section-heading">
            <span class="eyebrow">{{ section.eyebrow }}</span>
            <h2>{{ section.title }}</h2>
            <p>{{ section.intro }}</p>
          </div>

          <div [ngClass]="section.layout === 'two-up' ? 'content-grid content-grid--two' : 'content-grid content-grid--three'">
            <article class="feature-card" *ngFor="let card of section.cards">
              <span class="feature-card__metric" *ngIf="card.metric">{{ card.metric }}</span>
              <span class="feature-card__eyebrow" *ngIf="card.eyebrow">{{ card.eyebrow }}</span>
              <h3>{{ card.title }}</h3>
              <p>{{ card.body }}</p>
            </article>
          </div>
        </div>
      </section>

      <!-- FAQ -->
      <section class="faq-section" *ngIf="page.faqs?.length">
        <div class="site-shell">
          <div class="section-heading">
            <span class="eyebrow">FAQ</span>
            <h2>{{ locale === "es" ? "Preguntas frecuentes" : "Frequently asked questions" }}</h2>
          </div>
          <div class="faq-grid">
            <article class="faq-card" *ngFor="let item of page.faqs">
              <h3>{{ item.question }}</h3>
              <p>{{ item.answer }}</p>
            </article>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="cta-section">
        <div class="site-shell cta-panel">
          <div>
            <span class="eyebrow">{{ page.ctaPanel.eyebrow }}</span>
            <h2>{{ page.ctaPanel.title }}</h2>
            <p>{{ page.ctaPanel.body }}</p>
          </div>
          <div class="hero-actions">
            <a class="button button-primary" [routerLink]="page.ctaPanel.primaryPath">{{ page.ctaPanel.primaryLabel }}</a>
            <a class="button button-secondary" [routerLink]="page.ctaPanel.secondaryPath">{{ page.ctaPanel.secondaryLabel }}</a>
          </div>
        </div>
      </section>
    </app-marketing-frame>
  `,
})
export class CustomersPageComponent implements OnInit {
  locale: PublicLocale = "es";
  page!: PublicPageDefinition;
  alternatePage!: PublicPageDefinition;
  navigation: PublicPageDefinition[] = [];
  platform: PortalSettings = DEFAULT_PORTAL_SETTINGS;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly api: PortalApiService,
    private readonly seo: SeoService
  ) {}

  async ngOnInit(): Promise<void> {
    this.locale = (this.route.snapshot.data["locale"] as PublicLocale) ?? "es";
    this.page = getPublicPage("customers", this.locale);
    this.alternatePage = getAlternatePublicPage(this.page, this.locale === "es" ? "en" : "es");
    this.navigation = getPublicNavigation(this.locale);

    try {
      const publicData: PlatformPublicResponse = await this.api.publicPlatform();
      this.platform = publicData.platform;
    } catch {
      this.platform = DEFAULT_PORTAL_SETTINGS;
    }

    this.seo.update(buildPageSeo(this.page, this.platform, this.platform.portalBaseUrl));
  }
}
