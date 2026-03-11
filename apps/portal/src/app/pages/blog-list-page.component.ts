import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { DEFAULT_PORTAL_SETTINGS, getAlternatePublicPage, getPublicNavigation, getPublicPage, PublicLocale } from "../content/public-site";
import { BlogPostSummary, PlatformPublicResponse, PortalSettings } from "../core/models";
import { PortalApiService } from "../core/portal-api.service";
import { SeoService } from "../services/seo.service";
import { buildPageSeo } from "../services/seo-utils";

@Component({
  selector: "app-blog-list-page",
  standalone: true,
  imports: [CommonModule, RouterModule],
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
            <a class="plain-link" [routerLink]="alternatePage.path">{{ locale === 'es' ? 'EN' : 'ES' }}</a>
          </nav>
        </header>

        <header class="hero-card">
          <div class="eyebrow-row">
            <span class="eyebrow">{{ page.eyebrow }}</span>
            <a class="plain-link" [routerLink]="page.primaryCtaPath">{{ page.primaryCtaLabel }}</a>
          </div>

          <h1>{{ page.heroTitle }}</h1>
          <p class="hero-copy">{{ page.heroCopy }}</p>
          <p class="hero-summary">{{ page.heroSummary }}</p>
        </header>

        <section class="feature-band" *ngIf="posts.length; else emptyState">
          <article class="surface-card feature-band__item" *ngFor="let post of posts">
            <span class="eyebrow">{{ post.category || (locale === 'es' ? 'Editorial' : 'Editorial') }}</span>
            <h2>
              <a class="plain-link" [routerLink]="articlePath(post)">{{ post.title }}</a>
            </h2>
            <p>{{ post.summary }}</p>
            <div class="hero-meta">
              <span>{{ post.author }}</span>
              <span>{{ post.publishedAt | date: 'mediumDate' }}</span>
              <span>{{ post.locale.toUpperCase() }}</span>
            </div>
            <div class="hero-actions">
              <a class="button button-primary" [routerLink]="articlePath(post)">
                {{ locale === 'es' ? 'Leer articulo' : 'Read article' }}
              </a>
            </div>
          </article>
        </section>

        <ng-template #emptyState>
          <section class="surface-card public-cta-band">
            <div>
              <span class="eyebrow">{{ locale === 'es' ? 'Proximamente' : 'Coming soon' }}</span>
              <h2>{{ locale === 'es' ? 'El blog se esta poblando desde Auctorio.' : 'The blog is being filled from Auctorio.' }}</h2>
              <p>{{ locale === 'es'
                ? 'Las nuevas piezas editoriales se publicaran aqui en cuanto queden aprobadas.'
                : 'New editorial pieces will appear here as soon as they are approved.' }}</p>
            </div>
          </section>
        </ng-template>
      </div>
    </section>
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
