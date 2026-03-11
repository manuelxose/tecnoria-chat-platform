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
} from "../content/public-site";
import { PortalSettings, PlatformPublicResponse } from "../core/models";
import { PortalApiService } from "../core/portal-api.service";
import { WidgetDemoComponent } from "../shared/widget-demo.component";
import { SeoService } from "../services/seo.service";
import { buildPageSeo } from "../services/seo-utils";

@Component({
  selector: "app-public-page",
  standalone: true,
  imports: [CommonModule, RouterModule, WidgetDemoComponent],
  template: `
    <section class="hero-shell">
      <div class="site-shell">
        <header class="public-nav surface-card">
          <a class="brand-lockup" [routerLink]="locale === 'es' ? '/' : '/en'">
            <span class="brand-lockup__mark">T</span>
            <span>
              <strong>{{ platform.brandName }}</strong>
              <small>Developed by {{ platform.developedBy }}</small>
            </span>
          </a>

          <nav class="public-nav__links">
            @for (item of navigation; track item.path) {
              <a class="plain-link" [routerLink]="item.path">{{ item.navLabel }}</a>
            }
            <a class="plain-link" [routerLink]="page.locale === 'es' ? '/login' : '/login'">
              {{ locale === 'es' ? "Acceso portal" : "Portal login" }}
            </a>
            <a class="plain-link" [routerLink]="alternatePage.path">{{ locale === 'es' ? "EN" : "ES" }}</a>
          </nav>
        </header>

        <div class="public-hero-grid">
          <header class="hero-card">
            <div class="eyebrow-row">
              <span class="eyebrow">{{ page.eyebrow }}</span>
              <a class="plain-link" [routerLink]="page.primaryCtaPath">{{ page.primaryCtaLabel }}</a>
            </div>

            <h1>{{ page.heroTitle }}</h1>
            <p class="hero-copy">{{ page.heroCopy }}</p>
            <p class="hero-summary">{{ page.heroSummary }}</p>

            <div class="hero-actions">
              <a class="button button-primary" [routerLink]="page.primaryCtaPath">{{ page.primaryCtaLabel }}</a>
              <a class="button button-secondary" [routerLink]="page.secondaryCtaPath">{{ page.secondaryCtaLabel }}</a>
            </div>

            @if (page.key === 'home') {
              <div class="hero-grid">
                @for (point of platform.heroPoints; track point) {
                  <article class="surface-card surface-card--compact">
                    <strong>{{ point }}</strong>
                    <p>{{ locale === "es"
                      ? "Talkaris separa widget, conocimiento, tenants y gobierno sin acoplar la integración."
                      : "Talkaris separates widget, knowledge, tenants and governance without coupling the integration." }}</p>
                  </article>
                }
              </div>
            }

            <div class="hero-meta">
              <span>{{ platform.contactEmail }}</span>
              <span>{{ platform.portalBaseUrl }}</span>
              <span>{{ locale === "es" ? "Marca pública: Talkaris" : "Public brand: Talkaris" }}</span>
            </div>
          </header>

          <aside class="surface-card public-widget-card" *ngIf="page.key === 'home' && publicData">
            <span class="eyebrow">{{ locale === "es" ? "Demo en vivo" : "Live demo" }}</span>
            <h2>{{ locale === "es" ? "Widget público de Talkaris" : "Talkaris public widget" }}</h2>
            <p>{{ locale === "es"
              ? "La demo usa su propia configuración global y el mismo contrato de snippet que reciben los tenants."
              : "The demo uses its own global configuration and the same embed contract delivered to tenants." }}</p>
            <app-widget-demo
              [siteKey]="publicData.demo.siteKey"
              [apiBase]="publicData.platform.apiBaseUrl"
              [widgetBaseUrl]="publicData.platform.widgetBaseUrl"
            />
          </aside>
        </div>

        <section class="feature-band">
          @for (section of page.sections; track section.title) {
            <article class="surface-card feature-band__item">
              <span class="eyebrow">{{ section.eyebrow }}</span>
              <h2>{{ section.title }}</h2>
              <p>{{ section.body }}</p>
              @if (section.bullets?.length) {
                <ul class="plain-list">
                  @for (bullet of section.bullets; track bullet) {
                    <li>{{ bullet }}</li>
                  }
                </ul>
              }
            </article>
          }
        </section>

        <section class="surface-card faq-shell" *ngIf="page.faqs?.length">
          <span class="eyebrow">{{ locale === "es" ? "FAQ" : "FAQ" }}</span>
          <h2>{{ locale === "es" ? "Preguntas frecuentes" : "Frequently asked questions" }}</h2>
          <div class="faq-list">
            @for (item of page.faqs; track item.question) {
              <article class="faq-item">
                <strong>{{ item.question }}</strong>
                <p>{{ item.answer }}</p>
              </article>
            }
          </div>
        </section>

        <section class="surface-card public-cta-band">
          <div>
            <span class="eyebrow">{{ locale === "es" ? "Siguiente paso" : "Next step" }}</span>
            <h2>{{ locale === "es" ? "Pide acceso o prepara una demo guiada." : "Request access or book a guided demo." }}</h2>
            <p>{{ locale === "es"
              ? "La plataforma está pensada para operar integraciones independientes bajo control global."
              : "The platform is built to run independent integrations under central governance." }}</p>
          </div>
          <div class="hero-actions">
            <a class="button button-primary" [routerLink]="page.primaryCtaPath">{{ page.primaryCtaLabel }}</a>
            <a class="button button-secondary" routerLink="/login">
              {{ locale === "es" ? "Entrar al portal" : "Portal login" }}
            </a>
          </div>
        </section>
      </div>
    </section>
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

  private applySeo(): void {
    this.seo.update(buildPageSeo(this.page, this.platform, this.platform.portalBaseUrl));
  }
}
