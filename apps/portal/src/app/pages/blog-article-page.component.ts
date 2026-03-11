import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { DEFAULT_PORTAL_SETTINGS, PublicLocale } from "../content/public-site";
import { BlogPostDetail, PlatformPublicResponse, PortalSettings } from "../core/models";
import { PortalApiService } from "../core/portal-api.service";
import { SeoService } from "../services/seo.service";
import { buildBlogArticleSeo } from "../services/seo-utils";

@Component({
  selector: "app-blog-article-page",
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
            <a class="plain-link" [routerLink]="locale === 'es' ? '/blog' : '/en/blog'">Blog</a>
            <a class="plain-link" routerLink="/login">{{ locale === 'es' ? 'Portal' : 'Portal' }}</a>
          </nav>
        </header>

        <article class="hero-card" *ngIf="post; else notFound">
          <div class="eyebrow-row">
            <span class="eyebrow">{{ post.category || 'Editorial' }}</span>
            <a class="plain-link" [routerLink]="locale === 'es' ? '/blog' : '/en/blog'">
              {{ locale === 'es' ? 'Volver al blog' : 'Back to blog' }}
            </a>
          </div>

          <h1>{{ post.title }}</h1>
          <p class="hero-copy">{{ post.summary }}</p>

          <div class="hero-meta">
            <span>{{ post.author }}</span>
            <span>{{ post.publishedAt | date: 'mediumDate' }}</span>
            <span>{{ post.locale.toUpperCase() }}</span>
          </div>

          <img
            *ngIf="post.imageUrl"
            [src]="post.imageUrl"
            [alt]="post.title"
            style="width: 100%; border-radius: 24px; margin-top: 1.5rem;"
          />

          <section class="surface-card" style="margin-top: 1.5rem;">
            <div [innerHTML]="post.bodyHtml"></div>
          </section>
        </article>

        <ng-template #notFound>
          <section class="surface-card public-cta-band">
            <div>
              <span class="eyebrow">{{ locale === 'es' ? 'No encontrado' : 'Not found' }}</span>
              <h2>{{ locale === 'es' ? 'El articulo no esta disponible.' : 'This article is not available.' }}</h2>
              <p>{{ locale === 'es'
                ? 'Puede que siga en borrador o que la URL ya no exista.'
                : 'It may still be in draft or the URL may no longer exist.' }}</p>
            </div>
            <div class="hero-actions">
              <a class="button button-primary" [routerLink]="locale === 'es' ? '/blog' : '/en/blog'">
                {{ locale === 'es' ? 'Ver blog' : 'View blog' }}
              </a>
            </div>
          </section>
        </ng-template>
      </div>
    </section>
  `,
})
export class BlogArticlePageComponent implements OnInit {
  locale: PublicLocale = "es";
  platform: PortalSettings = DEFAULT_PORTAL_SETTINGS;
  post: BlogPostDetail | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly api: PortalApiService,
    private readonly seo: SeoService
  ) {}

  async ngOnInit(): Promise<void> {
    this.locale = this.route.snapshot.data["locale"] as PublicLocale;
    const slug = String(this.route.snapshot.paramMap.get("slug") || "").trim();

    try {
      const publicData: PlatformPublicResponse = await this.api.publicPlatform();
      this.platform = publicData.platform;
    } catch {
      this.platform = DEFAULT_PORTAL_SETTINGS;
    }

    if (!slug) {
      return;
    }

    try {
      this.post = await this.api.publicBlogPost(slug);
      this.seo.update(
        buildBlogArticleSeo(
          {
            title: this.post.seoTitle || this.post.title,
            description: this.post.seoDescription || this.post.summary,
            path: this.post.locale === "en" ? `/en/blog/${this.post.slug}` : `/blog/${this.post.slug}`,
            locale: this.post.locale,
            imageUrl: this.post.imageUrl,
            author: this.post.author,
            publishedAt: this.post.publishedAt,
          },
          this.platform,
          this.platform.portalBaseUrl
        )
      );
    } catch {
      this.post = null;
    }
  }
}
