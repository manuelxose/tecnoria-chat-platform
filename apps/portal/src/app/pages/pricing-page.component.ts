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
  selector: "app-pricing-page",
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

      <!-- Plans grid -->
      <section class="content-section" id="planes">
        <div class="site-shell">
          <div class="section-heading">
            <span class="eyebrow">{{ locale === "es" ? "Planes" : "Plans" }}</span>
            <h2>{{ locale === "es" ? "Elige el nivel que se adapta a tu operación." : "Choose the level that fits your operation." }}</h2>
            <p>{{ locale === "es" ? "Tres planes con alcance diferenciado para que el coste siempre tenga sentido." : "Three plans with differentiated scope so the cost always makes sense." }}</p>
          </div>

          <div class="pricing-grid">
            <!-- Starter -->
            <article class="pricing-card">
              <div class="pricing-card__header">
                <span class="eyebrow">Starter</span>
                <div class="pricing-card__price">
                  <strong>{{ locale === "es" ? "Desde 149€" : "From €149" }}</strong>
                  <span>{{ locale === "es" ? "/mes" : "/month" }}</span>
                </div>
                <p>{{ locale === "es" ? "Para equipos que quieren desplegar su primer asistente de IA de forma seria." : "For teams deploying their first AI assistant seriously." }}</p>
              </div>
              <ul class="pricing-card__features">
                <li>{{ locale === "es" ? "1 proyecto activo" : "1 active project" }}</li>
                <li>{{ locale === "es" ? "Widget embebido configurable" : "Configurable embedded widget" }}</li>
                <li>{{ locale === "es" ? "Fuentes: Sitemap, HTML, PDF" : "Sources: Sitemap, HTML, PDF" }}</li>
                <li>{{ locale === "es" ? "1.000 conversaciones/mes" : "1,000 conversations/month" }}</li>
                <li>{{ locale === "es" ? "Hasta 5 usuarios" : "Up to 5 users" }}</li>
                <li>{{ locale === "es" ? "Soporte por email" : "Email support" }}</li>
              </ul>
              <a class="button button-secondary button-primary--block" [routerLink]="page.primaryCtaPath">
                {{ locale === "es" ? "Solicitar demo" : "Request demo" }}
              </a>
            </article>

            <!-- Growth -->
            <article class="pricing-card pricing-card--featured">
              <div class="pricing-card__badge">{{ locale === "es" ? "Más popular" : "Most popular" }}</div>
              <div class="pricing-card__header">
                <span class="eyebrow">Growth</span>
                <div class="pricing-card__price">
                  <strong>{{ locale === "es" ? "Desde 399€" : "From €399" }}</strong>
                  <span>{{ locale === "es" ? "/mes" : "/month" }}</span>
                </div>
                <p>{{ locale === "es" ? "Para equipos que operan varios productos o superficies y necesitan el stack completo." : "For teams operating multiple products or surfaces that need the full stack." }}</p>
              </div>
              <ul class="pricing-card__features">
                <li>{{ locale === "es" ? "Hasta 5 proyectos activos" : "Up to 5 active projects" }}</li>
                <li>{{ locale === "es" ? "Todas las fuentes: YouTube, Notion, Gemini File" : "All sources: YouTube, Notion, Gemini File" }}</li>
                <li>{{ locale === "es" ? "10.000 conversaciones/mes" : "10,000 conversations/month" }}</li>
                <li>{{ locale === "es" ? "Hasta 20 usuarios" : "Up to 20 users" }}</li>
                <li>{{ locale === "es" ? "Handover humano" : "Human handover" }}</li>
                <li>{{ locale === "es" ? "Analytics avanzado + Webhooks + API keys" : "Advanced analytics + Webhooks + API keys" }}</li>
              </ul>
              <a class="button button-primary button-primary--block" [routerLink]="page.primaryCtaPath">
                {{ locale === "es" ? "Solicitar demo" : "Request demo" }}
              </a>
            </article>

            <!-- Enterprise -->
            <article class="pricing-card">
              <div class="pricing-card__header">
                <span class="eyebrow">Enterprise</span>
                <div class="pricing-card__price">
                  <strong>{{ locale === "es" ? "A medida" : "Custom" }}</strong>
                </div>
                <p>{{ locale === "es" ? "Para plataformas multi-tenant con SLA, whitelabeling e integraciones CRM." : "For multi-tenant platforms with SLA, whitelabeling and CRM integrations." }}</p>
              </div>
              <ul class="pricing-card__features">
                <li>{{ locale === "es" ? "Proyectos ilimitados" : "Unlimited projects" }}</li>
                <li>{{ locale === "es" ? "Multi-tenant completo" : "Full multi-tenant" }}</li>
                <li>{{ locale === "es" ? "SLA garantizado" : "Guaranteed SLA" }}</li>
                <li>{{ locale === "es" ? "Whitelabeling de widget" : "Widget whitelabeling" }}</li>
                <li>{{ locale === "es" ? "Integraciones HubSpot y Zendesk" : "HubSpot and Zendesk integrations" }}</li>
                <li>{{ locale === "es" ? "Onboarding dedicado" : "Dedicated onboarding" }}</li>
              </ul>
              <a class="button button-secondary button-primary--block" [routerLink]="page.primaryCtaPath">
                {{ locale === "es" ? "Contactar" : "Contact us" }}
              </a>
            </article>
          </div>
        </div>
      </section>

      <!-- Comparison table -->
      <section class="content-section" id="comparativa">
        <div class="site-shell">
          <div class="section-heading">
            <span class="eyebrow">{{ locale === "es" ? "Comparativa" : "Comparison" }}</span>
            <h2>{{ locale === "es" ? "¿Qué incluye cada plan?" : "What does each plan include?" }}</h2>
          </div>
          <div class="pricing-table-wrap">
            <table class="pricing-table">
              <thead>
                <tr>
                  <th>{{ locale === "es" ? "Funcionalidad" : "Feature" }}</th>
                  <th>Starter</th>
                  <th>Growth</th>
                  <th>Enterprise</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of comparisonRows">
                  <td>{{ locale === "es" ? row.labelEs : row.labelEn }}</td>
                  <td [innerHTML]="row.starter"></td>
                  <td [innerHTML]="row.growth"></td>
                  <td [innerHTML]="row.enterprise"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- FAQ -->
      <section class="faq-section" *ngIf="page.faqs?.length">
        <div class="site-shell">
          <div class="section-heading">
            <span class="eyebrow">FAQ</span>
            <h2>{{ locale === "es" ? "Preguntas sobre precios" : "Pricing questions" }}</h2>
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
  `})
export class PricingPageComponent implements OnInit {
  locale: PublicLocale = "es";
  page!: PublicPageDefinition;
  alternatePage!: PublicPageDefinition;
  navigation: PublicPageDefinition[] = [];
  platform: PortalSettings = DEFAULT_PORTAL_SETTINGS;

  comparisonRows = [
    { labelEs: "Proyectos", labelEn: "Projects", starter: "1", growth: "5", enterprise: "Ilimitados / Unlimited" },
    { labelEs: "Conversaciones/mes", labelEn: "Conversations/month", starter: "1.000 / 1,000", growth: "10.000 / 10,000", enterprise: "A medida / Custom" },
    { labelEs: "Usuarios", labelEn: "Users", starter: "5", growth: "20", enterprise: "Ilimitados / Unlimited" },
    { labelEs: "Widget embebido", labelEn: "Embedded widget", starter: "✓", growth: "✓", enterprise: "✓ + Whitelabel" },
    { labelEs: "Fuentes básicas (Sitemap, HTML, PDF)", labelEn: "Basic sources (Sitemap, HTML, PDF)", starter: "✓", growth: "✓", enterprise: "✓" },
    { labelEs: "YouTube, Notion, Gemini File", labelEn: "YouTube, Notion, Gemini File", starter: "—", growth: "✓", enterprise: "✓" },
    { labelEs: "Handover humano", labelEn: "Human handover", starter: "—", growth: "✓", enterprise: "✓" },
    { labelEs: "Analytics avanzado", labelEn: "Advanced analytics", starter: "—", growth: "✓", enterprise: "✓" },
    { labelEs: "API keys + Webhooks", labelEn: "API keys + Webhooks", starter: "—", growth: "✓", enterprise: "✓" },
    { labelEs: "Multi-tenant", labelEn: "Multi-tenant", starter: "—", growth: "—", enterprise: "✓" },
    { labelEs: "SLA", labelEn: "SLA", starter: "—", growth: "—", enterprise: "✓" },
    { labelEs: "HubSpot / Zendesk", labelEn: "HubSpot / Zendesk", starter: "—", growth: "—", enterprise: "✓" },
    { labelEs: "Onboarding dedicado", labelEn: "Dedicated onboarding", starter: "—", growth: "—", enterprise: "✓" },
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly api: PortalApiService,
    private readonly seo: SeoService
  ) {}

  async ngOnInit(): Promise<void> {
    this.locale = (this.route.snapshot.data["locale"] as PublicLocale) ?? "es";
    this.page = getPublicPage("pricing", this.locale);
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
