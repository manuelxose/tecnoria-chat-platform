import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, RouterModule } from "@angular/router";
import {
  DEFAULT_PORTAL_SETTINGS,
  getAlternatePublicPage,
  getPublicNavigation,
  getPublicPage,
  PublicLocale,
} from "../content/public-site";
import { BlogPostSummary, PlatformPublicResponse, PortalSettings } from "../core/models";
import { PortalApiService } from "../core/portal-api.service";
import { buildPageSeo } from "../services/seo-utils";
import { SeoService } from "../services/seo.service";
import { MarketingFrameComponent } from "../shared/marketing-frame.component";

@Component({
  selector: "app-blog-list-page",
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
            <span>Blog</span>
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
            </div>

            <aside class="hero-visual hero-visual--editorial">
              <img class="hero-visual__image" [src]="page.heroImage" [alt]="page.heroImageAlt" />
              <div class="hero-visual__note">
                <span class="eyebrow">{{ locale === "es" ? "Mapa editorial" : "Editorial map" }}</span>
                <h2>
                  {{
                    locale === "es"
                      ? "Contenido pensado para posicionar, educar y empujar a demo."
                      : "Content built to rank, educate and move people toward a demo."
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
            <span class="eyebrow">{{ locale === "es" ? "Enfoque editorial" : "Editorial focus" }}</span>
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

      <section class="content-section" *ngFor="let section of page.sections">
        <div class="site-shell">
          <div class="section-heading">
            <span class="eyebrow">{{ section.eyebrow }}</span>
            <h2>{{ section.title }}</h2>
            <p>{{ section.intro }}</p>
          </div>
          <div class="content-grid content-grid--three">
            <article class="feature-card" *ngFor="let card of section.cards">
              <h3>{{ card.title }}</h3>
              <p>{{ card.body }}</p>
            </article>
          </div>
        </div>
      </section>

      <section class="content-section">
        <div class="site-shell">
          <div class="section-heading">
            <span class="eyebrow">{{ locale === "es" ? "Artículos" : "Articles" }}</span>
            <h2>
              {{
                locale === "es"
                  ? "Contenido publicado y preparado para enlazar con la propuesta principal."
                  : "Published content prepared to link back into the main value proposition."
              }}
            </h2>
            <p>
              {{
                locale === "es"
                  ? "Cada pieza debe ayudar a rankear, reforzar autoridad y enviar tráfico a las páginas comerciales correctas."
                  : "Every piece should help rankings, reinforce authority and send traffic to the right commercial pages."
              }}
            </p>
          </div>

          <div class="blog-grid" *ngIf="posts.length; else emptyState">
            <article class="blog-card" *ngFor="let post of posts">
              <img
                class="blog-card__image"
                [src]="post.imageUrl || '/assets/talkaris-editorial-campaign.png'"
                [alt]="post.imageUrl ? post.title : ''"
                loading="lazy"
              />
              <div class="blog-card__body">
                <span class="badge badge--ghost">{{ post.category || (locale === "es" ? "Editorial" : "Editorial") }}</span>
                <h3>
                  <a [routerLink]="articlePath(post)">{{ post.title }}</a>
                </h3>
                <p>{{ post.summary }}</p>
                <div class="hero-meta">
                  <span>{{ post.author }}</span>
                  <span>{{ post.publishedAt | date: "mediumDate" }}</span>
                </div>
                <a class="plain-link" [routerLink]="articlePath(post)">
                  {{ locale === "es" ? "Leer artículo" : "Read article" }}
                </a>
              </div>
            </article>
          </div>

          <ng-template #emptyState>
            <div class="empty-state-card">
              <div>
                <span class="eyebrow">{{ locale === "es" ? "Próximamente" : "Coming soon" }}</span>
                <h3>
                  {{
                    locale === "es"
                      ? "El blog ya tiene arquitectura editorial aunque aún no tenga piezas publicadas."
                      : "The blog already has an editorial architecture even if no posts are live yet."
                  }}
                </h3>
                <p>
                  {{
                    locale === "es"
                      ? "Las publicaciones llegarán desde Auctorio. Mientras tanto, la capa de diseño, enlazado y SEO queda preparada para escalar contenido sin rehacer el front."
                      : "Posts will arrive from Auctorio. In the meantime, the design, linking and SEO layer is already prepared to scale content without reworking the front end."
                  }}
                </p>
              </div>
              <div class="hero-actions">
                <a class="button button-primary" [routerLink]="page.primaryCtaPath">{{ page.primaryCtaLabel }}</a>
                <a class="button button-secondary" [routerLink]="locale === 'es' ? '/funcionalidades' : '/en/features'">
                  {{ locale === "es" ? "Ver plataforma" : "See platform" }}
                </a>
              </div>
            </div>
          </ng-template>
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
            <a class="button button-secondary" [routerLink]="page.ctaPanel.secondaryPath">{{ page.ctaPanel.secondaryLabel }}</a>
          </div>
        </div>
      </section>
    </app-marketing-frame>
  `,
})
export class BlogListPageComponent implements OnInit {
  locale: PublicLocale = "es";
  page = getPublicPage("blog", "es");
  alternatePage = getAlternatePublicPage(this.page, "en");
  navigation = getPublicNavigation("es");
  platform: PortalSettings = DEFAULT_PORTAL_SETTINGS;
  publicData: PlatformPublicResponse | null = null;
  posts: BlogPostSummary[] = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly api: PortalApiService,
    private readonly seo: SeoService
  ) {}

  async ngOnInit(): Promise<void> {
    this.locale = this.route.snapshot.data["locale"] as PublicLocale;
    this.page = getPublicPage("blog", this.locale);
    this.alternatePage = getAlternatePublicPage(this.page, this.locale === "es" ? "en" : "es");
    this.navigation = getPublicNavigation(this.locale);

    try {
      this.publicData = await this.api.publicPlatform();
      this.platform = this.publicData.platform;
    } catch {
      this.platform = DEFAULT_PORTAL_SETTINGS;
    }

    this.seo.update(buildPageSeo(this.page, this.platform, this.platform.portalBaseUrl));

    try {
      const response = await this.api.publicBlog(this.locale, 24);
      this.posts = response.items;
    } catch {
      this.posts = [];
    }
  }

  articlePath(post: BlogPostSummary): string {
    return post.locale === "en" ? `/en/blog/${post.slug}` : `/blog/${post.slug}`;
  }
}
