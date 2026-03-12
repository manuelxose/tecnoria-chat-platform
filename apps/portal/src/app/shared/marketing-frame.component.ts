import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { RouterModule } from "@angular/router";
import { PublicLocale, PublicPageDefinition } from "../content/public-site";
import { PortalSettings } from "../core/models";

@Component({
  selector: "app-marketing-frame",
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <a class="skip-link" href="#main-content">
      {{ locale === "es" ? "Saltar al contenido" : "Skip to content" }}
    </a>

    <div class="marketing-shell">
      <header class="site-header-wrap">
        <div class="site-shell">
          <div class="site-header">
            <a class="brand-lockup" [routerLink]="locale === 'es' ? '/' : '/en'" aria-label="Talkaris home">
              <span class="brand-lockup__mark">T</span>
              <span class="brand-lockup__copy">
                <strong>{{ platform.brandName }}</strong>
                <small>{{ locale === "es" ? "IA conversacional operable" : "Operational conversational AI" }}</small>
              </span>
            </a>

            <button
              type="button"
              class="menu-toggle"
              (click)="menuOpen = !menuOpen"
              [attr.aria-expanded]="menuOpen"
              aria-controls="marketing-navigation"
            >
              {{ locale === "es" ? "Menú" : "Menu" }}
            </button>

            <nav class="site-nav" id="marketing-navigation" [class.is-open]="menuOpen" aria-label="Primary">
              <a
                class="site-nav__link"
                *ngFor="let item of navigation"
                [routerLink]="item.path"
                routerLinkActive="is-active"
                [routerLinkActiveOptions]="{ exact: item.key === 'home' }"
                (click)="menuOpen = false"
              >
                {{ item.navLabel }}
              </a>
              <a class="site-nav__link" [routerLink]="locale === 'es' ? '/login' : '/login'" (click)="menuOpen = false">
                {{ locale === "es" ? "Portal" : "Portal" }}
              </a>
              <a class="site-nav__link site-nav__link--lang" [routerLink]="alternatePath" (click)="menuOpen = false">
                {{ locale === "es" ? "EN" : "ES" }}
              </a>
              <a class="button button-primary button-primary--header" [routerLink]="ctaPath" (click)="menuOpen = false">
                {{ ctaLabel }}
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main>
        <ng-content />
      </main>

      <footer class="site-footer">
        <div class="site-shell site-footer__grid">
          <div class="site-footer__brand">
            <span class="eyebrow">{{ locale === "es" ? "Talkaris" : "Talkaris" }}</span>
            <h2>{{ platform.tagline }}</h2>
            <p>{{ platform.summary }}</p>
            <div class="footer-proof">
              <span>{{ locale === "es" ? "Widget embebible" : "Embeddable widget" }}</span>
              <span>{{ locale === "es" ? "Conocimiento gobernado" : "Governed knowledge" }}</span>
              <span>{{ locale === "es" ? "Operación multi-tenant" : "Multi-tenant operations" }}</span>
            </div>
          </div>

          <div class="site-footer__links">
            <div>
              <h3>{{ locale === "es" ? "Plataforma" : "Platform" }}</h3>
              <a [routerLink]="locale === 'es' ? '/funcionalidades' : '/en/features'">
                {{ locale === "es" ? "Funcionalidades" : "Features" }}
              </a>
              <a [routerLink]="locale === 'es' ? '/integraciones' : '/en/integrations'">
                {{ locale === "es" ? "Integraciones" : "Integrations" }}
              </a>
              <a [routerLink]="locale === 'es' ? '/casos-de-uso' : '/en/use-cases'">
                {{ locale === "es" ? "Casos de uso" : "Use cases" }}
              </a>
            </div>
            <div>
              <h3>{{ locale === "es" ? "Contenido" : "Content" }}</h3>
              <a [routerLink]="locale === 'es' ? '/blog' : '/en/blog'">Blog</a>
              <a [routerLink]="locale === 'es' ? '/faq' : '/en/faq'">FAQ</a>
              <a [routerLink]="ctaPath">{{ ctaLabel }}</a>
            </div>
            <div>
              <h3>{{ locale === "es" ? "Contacto" : "Contact" }}</h3>
              <a [href]="'mailto:' + platform.contactEmail">{{ platform.contactEmail }}</a>
              <a [href]="platform.portalBaseUrl" target="_blank" rel="noreferrer">{{ platform.portalBaseUrl }}</a>
              <a [routerLink]="locale === 'es' ? '/login' : '/login'">
                {{ locale === "es" ? "Acceso al portal" : "Portal access" }}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  `,
})
export class MarketingFrameComponent {
  @Input({ required: true }) locale: PublicLocale = "es";
  @Input({ required: true }) platform!: PortalSettings;
  @Input({ required: true }) navigation: PublicPageDefinition[] = [];
  @Input({ required: true }) alternatePath = "";
  @Input({ required: true }) ctaLabel = "";
  @Input({ required: true }) ctaPath = "";

  menuOpen = false;
}
