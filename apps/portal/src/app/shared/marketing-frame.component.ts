import { CommonModule, DOCUMENT } from "@angular/common";
import { Component, HostListener, Inject, Input, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";
import { PublicLocale, PublicPageDefinition } from "../content/public-site";
import { PortalSettings } from "../core/models";
import { LogoBarComponent } from "./logo-bar.component";

@Component({
  selector: "app-marketing-frame",
  standalone: true,
  imports: [CommonModule, RouterModule, LogoBarComponent],
  template: `
    <a class="skip-link" href="#main-content">
      {{ locale === "es" ? "Saltar al contenido" : "Skip to content" }}
    </a>

    <!-- Sticky CTA bar -->
    <div class="sticky-cta" [class.sticky-cta--visible]="showStickyCta" *ngIf="!stickyDismissed">
      <div class="sticky-cta__inner">
        <span>{{ locale === "es" ? "¿Quieres ver Talkaris funcionando?" : "Want to see Talkaris in action?" }}</span>
        <a class="button button-primary button-primary--sm" [routerLink]="ctaPath">
          {{ locale === "es" ? "Solicitar demo →" : "Request demo →" }}
        </a>
        <button class="sticky-cta__close" type="button" (click)="dismissStickyCta()" aria-label="Cerrar">✕</button>
      </div>
    </div>

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

      <!-- Logo bar -->
      <app-logo-bar></app-logo-bar>

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
            <div class="footer-trust-badges">
              <span class="trust-badge">SSR-ready</span>
              <span class="trust-badge">Multi-LLM</span>
              <span class="trust-badge">GDPR-friendly</span>
              <span class="trust-badge">Zero lock-in</span>
            </div>
          </div>

          <div class="site-footer__links">
            <div>
              <h3>{{ locale === "es" ? "Producto" : "Product" }}</h3>
              <a [routerLink]="locale === 'es' ? '/funcionalidades' : '/en/features'">
                {{ locale === "es" ? "Funcionalidades" : "Features" }}
              </a>
              <a [routerLink]="locale === 'es' ? '/integraciones' : '/en/integrations'">
                {{ locale === "es" ? "Integraciones" : "Integrations" }}
              </a>
              <a [routerLink]="locale === 'es' ? '/casos-de-uso' : '/en/use-cases'">
                {{ locale === "es" ? "Casos de uso" : "Use cases" }}
              </a>
              <a [routerLink]="locale === 'es' ? '/precios' : '/en/pricing'">
                {{ locale === "es" ? "Precios" : "Pricing" }}
              </a>
              <a [routerLink]="locale === 'es' ? '/clientes' : '/en/customers'">
                {{ locale === "es" ? "Clientes" : "Customers" }}
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
              <a [routerLink]="'/login'">
                {{ locale === "es" ? "Acceso al portal" : "Portal access" }}
              </a>
            </div>
          </div>
        </div>

        <div class="site-shell site-footer__legal">
          <span>© 2026 Talkaris</span>
          <span class="site-footer__sep">·</span>
          <span>{{ locale === "es" ? "Política de privacidad" : "Privacy policy" }}</span>
          <span class="site-footer__sep">·</span>
          <span>{{ locale === "es" ? "Términos de uso" : "Terms of use" }}</span>
          <span class="site-footer__sep">·</span>
          <a [href]="'mailto:' + platform.supportEmail">{{ locale === "es" ? "Soporte" : "Support" }}: {{ platform.supportEmail }}</a>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .sticky-cta {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 900;
      background: var(--surface-dark, #081424);
      color: #fff;
      transform: translateY(100%);
      transition: transform 0.3s ease;
    }
    .sticky-cta--visible { transform: translateY(0); }
    .sticky-cta__inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0.75rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 1.5rem;
      font-size: 0.9rem;
    }
    .sticky-cta__inner span { flex: 1; }
    .sticky-cta__close {
      background: none;
      border: none;
      color: rgba(255,255,255,0.6);
      cursor: pointer;
      font-size: 1rem;
      padding: 0.25rem;
      line-height: 1;
    }
    .sticky-cta__close:hover { color: #fff; }
    .button-primary--sm {
      padding: 0.5rem 1rem;
      font-size: 0.85rem;
      white-space: nowrap;
    }
    .footer-trust-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 1rem;
    }
    .trust-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.6rem;
      border-radius: 4px;
      border: 1px solid color-mix(in srgb, var(--gold, #c29a52) 40%, transparent);
      color: var(--gold, #c29a52);
    }
    .site-footer__legal {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(255,255,255,0.1);
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      font-size: 0.8rem;
      opacity: 0.6;
    }
    .site-footer__sep { opacity: 0.4; }
  `],
})
export class MarketingFrameComponent implements OnInit {
  @Input({ required: true }) locale: PublicLocale = "es";
  @Input({ required: true }) platform!: PortalSettings;
  @Input({ required: true }) navigation: PublicPageDefinition[] = [];
  @Input({ required: true }) alternatePath = "";
  @Input({ required: true }) ctaLabel = "";
  @Input({ required: true }) ctaPath = "";

  menuOpen = false;
  showStickyCta = false;
  stickyDismissed = false;

  constructor(@Inject(DOCUMENT) private readonly document: Document) {}

  ngOnInit(): void {
    if (typeof sessionStorage !== "undefined") {
      this.stickyDismissed = sessionStorage.getItem("sticky-cta-dismissed") === "1";
    }
  }

  @HostListener("window:scroll")
  onScroll(): void {
    if (this.stickyDismissed) return;
    if (typeof window !== "undefined") {
      this.showStickyCta = window.scrollY > 300;
    }
  }

  dismissStickyCta(): void {
    this.stickyDismissed = true;
    this.showStickyCta = false;
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("sticky-cta-dismissed", "1");
    }
  }
}
