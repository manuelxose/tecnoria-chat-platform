import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { DEFAULT_PORTAL_SETTINGS, getPublicNavigation, PublicLocale } from "../content/public-site";
import { BlogPostDetail, PlatformPublicResponse, PortalSettings } from "../core/models";
import { PortalApiService } from "../core/portal-api.service";
import { buildBlogArticleSeo } from "../services/seo-utils";
import { SeoService } from "../services/seo.service";
import { MarketingFrameComponent } from "../shared/marketing-frame.component";

@Component({
  selector: "app-blog-article-page",
  standalone: true,
  imports: [CommonModule, RouterModule, MarketingFrameComponent],
  template: `
    <app-marketing-frame
      [locale]="locale"
      [platform]="platform"
      [navigation]="navigation"
      [alternatePath]="locale === 'es' ? '/en/blog' : '/blog'"
      [ctaLabel]="locale === 'es' ? 'Solicitar demo' : 'Request demo'"
      [ctaPath]="locale === 'es' ? '/solicitar-demo' : '/en/request-demo'"
    >
      <section class="page-hero page-hero--compact" id="main-content" *ngIf="post; else notFound">
        <div class="site-shell article-shell">
          <div class="breadcrumb-row">
            <a [routerLink]="locale === 'es' ? '/' : '/en'">{{ locale === "es" ? "Inicio" : "Home" }}</a>
            <span>/</span>
            <a [routerLink]="locale === 'es' ? '/blog' : '/en/blog'">Blog</a>
            <span>/</span>
            <span>{{ post?.title }}</span>
          </div>

          <article class="article-hero-card">
            <span class="eyebrow">{{ post.category || (locale === "es" ? "Editorial" : "Editorial") }}</span>
            <h1>{{ post.title }}</h1>
            <p class="hero-copy">{{ post.summary }}</p>

            <div class="hero-meta">
              <span>{{ post.author }}</span>
              <span>{{ post.publishedAt | date: "mediumDate" }}</span>
              <span>{{ post.locale.toUpperCase() }}</span>
              <span *ngIf="readingTime > 0">
                {{ readingTime }} {{ locale === "es" ? "min de lectura" : "min read" }}
              </span>
            </div>

            <img
              class="article-hero-card__image"
              [src]="post.imageUrl || '/assets/talkaris-editorial-campaign.png'"
              [alt]="post.imageUrl ? post.title : ''"
              loading="eager"
            />
          </article>

          <div class="article-layout">
            <aside class="article-sidebar">
              <div class="article-sidebar__card">
                <span class="eyebrow">{{ locale === "es" ? "Qué cubre" : "What it covers" }}</span>
                <h2>{{ locale === "es" ? "Lectura con salida comercial clara." : "Editorial content with a clear commercial exit." }}</h2>
                <p>
                  {{
                    locale === "es"
                      ? "Cada artículo debe reforzar autoridad, enlazar con la capa comercial correcta y ayudar a decidir el siguiente paso."
                      : "Every article should reinforce authority, link back to the right commercial surface and clarify the next step."
                  }}
                </p>
              </div>
              <div class="article-sidebar__card">
                <span class="eyebrow">{{ locale === "es" ? "Siguiente paso" : "Next step" }}</span>
                <h2>{{ locale === "es" ? "Lleva el tema a tu caso." : "Apply the topic to your case." }}</h2>
                <a class="button button-primary button-primary--block" [routerLink]="locale === 'es' ? '/solicitar-demo' : '/en/request-demo'">
                  {{ locale === "es" ? "Solicitar demo" : "Request demo" }}
                </a>
              </div>
            </aside>

            <article class="article-body-card">
              <div class="article-body" [innerHTML]="post.bodyHtml"></div>

              <!-- Lead magnet block -->
              <div class="article-lead-magnet">
                <span class="eyebrow">{{ locale === "es" ? "¿Te resultó útil?" : "Found this useful?" }}</span>
                <h2>{{ locale === "es" ? "¿Buscas un stack conversacional serio para tu empresa?" : "Looking for a serious conversational stack for your company?" }}</h2>
                <p>{{ locale === "es" ? "Talkaris es la plataforma que combina widget, conocimiento gobernado y analítica para equipos B2B que necesitan más que un chatbot." : "Talkaris is the platform combining widget, governed knowledge and analytics for B2B teams that need more than a chatbot." }}</p>
                <div class="hero-actions">
                  <a class="button button-primary" [routerLink]="locale === 'es' ? '/solicitar-demo' : '/en/request-demo'">
                    {{ locale === "es" ? "Solicitar demo" : "Request demo" }}
                  </a>
                  <a class="button button-secondary" [routerLink]="locale === 'es' ? '/funcionalidades' : '/en/features'">
                    {{ locale === "es" ? "Ver funcionalidades" : "See features" }}
                  </a>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <ng-template #notFound>
        <section class="page-hero page-hero--compact" id="main-content">
          <div class="site-shell">
            <div class="empty-state-card">
              <div>
                <span class="eyebrow">{{ locale === "es" ? "No encontrado" : "Not found" }}</span>
                <h1>{{ locale === "es" ? "Este artículo no está disponible." : "This article is not available." }}</h1>
                <p>
                  {{
                    locale === "es"
                      ? "Puede que siga en borrador, que se haya despublicado o que la URL ya no exista."
                      : "It may still be a draft, it may have been unpublished, or the URL may no longer exist."
                  }}
                </p>
              </div>
              <div class="hero-actions">
                <a class="button button-primary" [routerLink]="locale === 'es' ? '/blog' : '/en/blog'">
                  {{ locale === "es" ? "Volver al blog" : "Back to blog" }}
                </a>
                <a class="button button-secondary" [routerLink]="locale === 'es' ? '/' : '/en'">
                  {{ locale === "es" ? "Volver al inicio" : "Back to home" }}
                </a>
              </div>
            </div>
          </div>
        </section>
      </ng-template>
    </app-marketing-frame>
  `,
})
export class BlogArticlePageComponent implements OnInit {
  locale: PublicLocale = "es";
  platform: PortalSettings = DEFAULT_PORTAL_SETTINGS;
  navigation = getPublicNavigation("es");
  post: BlogPostDetail | null = null;
  readingTime = 0;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly api: PortalApiService,
    private readonly seo: SeoService
  ) {}

  async ngOnInit(): Promise<void> {
    this.locale = this.route.snapshot.data["locale"] as PublicLocale;
    this.navigation = getPublicNavigation(this.locale);
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
      if (this.post.bodyHtml) {
        const text = this.post.bodyHtml.replace(/<[^>]+>/g, " ");
        const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
        this.readingTime = Math.max(1, Math.round(wordCount / 200));
      }
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
