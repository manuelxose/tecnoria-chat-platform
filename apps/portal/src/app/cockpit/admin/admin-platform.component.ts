import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { PortalApiService } from "../../core/portal-api.service";
import { PortalSettings } from "../../core/models";

@Component({
  selector: "app-admin-platform",
  standalone: true,
  imports: [RouterModule, FormsModule],
  template: `
    <div class="ck-topbar">
      <div class="ck-topbar__breadcrumb">
        <a routerLink="/admin/overview" style="color: var(--ck-text-muted); text-decoration: none;">Superadmin</a>
        <span>›</span>
        <strong>Platform Settings</strong>
      </div>
      <div class="ck-topbar__actions">
        <button class="ck-btn ck-btn--secondary ck-btn--sm" (click)="discard()">Discard</button>
        <button class="ck-btn ck-btn--primary ck-btn--sm" (click)="save()" [disabled]="saving">
          {{ saving ? 'Saving…' : 'Save Changes' }}
        </button>
      </div>
    </div>

    <div class="ck-content">
      <div class="ck-page-header">
        <div>
          <h1 class="ck-page-header__title">Platform Settings</h1>
          <p class="ck-page-header__sub">Global branding, SEO and infrastructure configuration</p>
        </div>
      </div>

      @if (saveSuccess) {
        <div class="ck-alert ck-alert--success" style="margin-bottom: 16px;">Settings saved successfully.</div>
      }
      @if (saveError) {
        <div class="ck-alert ck-alert--danger" style="margin-bottom: 16px;">{{ saveError }}</div>
      }

      @if (loading) {
        <div class="ck-card">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="ck-skeleton" style="height: 44px; margin-bottom: 10px;"></div>
          }
        </div>
      } @else {
        <div style="display: grid; gap: 16px; max-width: 800px;">
          <!-- Brand -->
          <div class="ck-card">
            <div class="ck-card__header">
              <p class="ck-card__title">Brand Identity</p>
            </div>
            <div class="ck-form-stack">
              <div class="ck-form-grid">
                <div class="ck-field">
                  <label class="ck-label">Brand Name</label>
                  <input class="ck-input" [(ngModel)]="form.brandName" />
                </div>
                <div class="ck-field">
                  <label class="ck-label">Legal Name</label>
                  <input class="ck-input" [(ngModel)]="form.legalName" />
                </div>
              </div>
              <div class="ck-field">
                <label class="ck-label">Tagline</label>
                <input class="ck-input" [(ngModel)]="form.tagline" />
              </div>
              <div class="ck-field">
                <label class="ck-label">Summary</label>
                <textarea class="ck-textarea" [(ngModel)]="form.summary" rows="3"></textarea>
              </div>
              <div class="ck-form-grid">
                <div class="ck-field">
                  <label class="ck-label">Support Email</label>
                  <input class="ck-input" [(ngModel)]="form.supportEmail" type="email" />
                </div>
                <div class="ck-field">
                  <label class="ck-label">Contact Email</label>
                  <input class="ck-input" [(ngModel)]="form.contactEmail" type="email" />
                </div>
              </div>
              <div class="ck-field">
                <label class="ck-label">Organization Name</label>
                <input class="ck-input" [(ngModel)]="form.organizationName" />
              </div>
            </div>
          </div>

          <!-- Infrastructure -->
          <div class="ck-card">
            <div class="ck-card__header">
              <p class="ck-card__title">Infrastructure URLs</p>
            </div>
            <div class="ck-form-stack">
              <div class="ck-form-grid">
                <div class="ck-field">
                  <label class="ck-label">Website URL</label>
                  <input class="ck-input" [(ngModel)]="form.websiteUrl" />
                </div>
                <div class="ck-field">
                  <label class="ck-label">Product Domain</label>
                  <input class="ck-input" [(ngModel)]="form.productDomain" />
                </div>
              </div>
              <div class="ck-form-grid">
                <div class="ck-field">
                  <label class="ck-label">Portal Base URL</label>
                  <input class="ck-input" [(ngModel)]="form.portalBaseUrl" />
                </div>
                <div class="ck-field">
                  <label class="ck-label">API Base URL</label>
                  <input class="ck-input" [(ngModel)]="form.apiBaseUrl" />
                </div>
              </div>
              <div class="ck-form-grid">
                <div class="ck-field">
                  <label class="ck-label">Widget Base URL</label>
                  <input class="ck-input" [(ngModel)]="form.widgetBaseUrl" />
                </div>
                <div class="ck-field">
                  <label class="ck-label">Default Locale</label>
                  <input class="ck-input" [(ngModel)]="form.defaultLocale" placeholder="es" />
                </div>
              </div>
            </div>
          </div>

          <!-- Demo config -->
          <div class="ck-card">
            <div class="ck-card__header">
              <p class="ck-card__title">Demo Configuration</p>
            </div>
            <div class="ck-form-grid">
              <div class="ck-field">
                <label class="ck-label">Demo Project Key</label>
                <input class="ck-input" [(ngModel)]="form.demoProjectKey" />
              </div>
              <div class="ck-field">
                <label class="ck-label">Demo Site Key</label>
                <input class="ck-input" [(ngModel)]="form.demoSiteKey" />
              </div>
            </div>
          </div>

          <!-- SEO -->
          <div class="ck-card">
            <div class="ck-card__header">
              <p class="ck-card__title">SEO</p>
            </div>
            <div class="ck-form-stack">
              <div class="ck-field">
                <label class="ck-label">SEO Title</label>
                <input class="ck-input" [(ngModel)]="form.seoTitle" />
              </div>
              <div class="ck-field">
                <label class="ck-label">SEO Description</label>
                <textarea class="ck-textarea" [(ngModel)]="form.seoDescription" rows="2"></textarea>
              </div>
              <div class="ck-form-grid">
                <div class="ck-field">
                  <label class="ck-label">SEO Image URL</label>
                  <input class="ck-input" [(ngModel)]="form.seoImageUrl" />
                </div>
                <div class="ck-field">
                  <label class="ck-label">SEO Keywords</label>
                  <input class="ck-input" [(ngModel)]="form.seoKeywordsText" placeholder="ai, chatbot, talkaris" />
                </div>
              </div>
              <div class="ck-field">
                <label class="ck-label">Hero Points (one per line)</label>
                <textarea class="ck-textarea" [(ngModel)]="form.heroPointsText" rows="4" placeholder="Deploy AI agents in minutes&#10;No code required&#10;..."></textarea>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class AdminPlatformComponent implements OnInit {
  loading = true;
  saving = false;
  saveSuccess = false;
  saveError = "";
  originalSettings: PortalSettings | null = null;

  form = {
    brandName: "", legalName: "", tagline: "", summary: "",
    supportEmail: "", contactEmail: "", organizationName: "",
    websiteUrl: "", productDomain: "", portalBaseUrl: "", apiBaseUrl: "",
    widgetBaseUrl: "", defaultLocale: "", demoProjectKey: "", demoSiteKey: "",
    seoTitle: "", seoDescription: "", seoImageUrl: "", seoKeywordsText: "",
    heroPointsText: "",
  };

  constructor(private readonly api: PortalApiService) {}

  async ngOnInit(): Promise<void> {
    this.loading = true;
    try {
      const settings = await this.api.adminPlatformSettings();
      this.originalSettings = settings;
      this.form = {
        brandName: settings.brandName,
        legalName: settings.legalName,
        tagline: settings.tagline,
        summary: settings.summary,
        supportEmail: settings.supportEmail,
        contactEmail: settings.contactEmail,
        organizationName: settings.organizationName,
        websiteUrl: settings.websiteUrl,
        productDomain: settings.productDomain,
        portalBaseUrl: settings.portalBaseUrl,
        apiBaseUrl: settings.apiBaseUrl,
        widgetBaseUrl: settings.widgetBaseUrl,
        defaultLocale: settings.defaultLocale,
        demoProjectKey: settings.demoProjectKey,
        demoSiteKey: settings.demoSiteKey,
        seoTitle: settings.seoTitle,
        seoDescription: settings.seoDescription,
        seoImageUrl: settings.seoImageUrl,
        seoKeywordsText: settings.seoKeywords.join(", "),
        heroPointsText: settings.heroPoints.join("\n"),
      };
    } finally {
      this.loading = false;
    }
  }

  async save(): Promise<void> {
    this.saving = true;
    this.saveError = "";
    try {
      await this.api.updatePlatformSettings({
        brandName: this.form.brandName,
        legalName: this.form.legalName,
        tagline: this.form.tagline,
        summary: this.form.summary,
        supportEmail: this.form.supportEmail,
        contactEmail: this.form.contactEmail,
        organizationName: this.form.organizationName,
        websiteUrl: this.form.websiteUrl,
        productDomain: this.form.productDomain,
        portalBaseUrl: this.form.portalBaseUrl,
        apiBaseUrl: this.form.apiBaseUrl,
        widgetBaseUrl: this.form.widgetBaseUrl,
        defaultLocale: this.form.defaultLocale,
        demoProjectKey: this.form.demoProjectKey,
        demoSiteKey: this.form.demoSiteKey,
        seoTitle: this.form.seoTitle,
        seoDescription: this.form.seoDescription,
        seoImageUrl: this.form.seoImageUrl,
        seoKeywords: this.form.seoKeywordsText.split(",").map((k) => k.trim()).filter(Boolean),
        heroPoints: this.form.heroPointsText.split("\n").map((p) => p.trim()).filter(Boolean),
      });
      this.saveSuccess = true;
      setTimeout(() => (this.saveSuccess = false), 3000);
    } catch (e: any) {
      this.saveError = e?.message ?? "Failed to save settings.";
    } finally {
      this.saving = false;
    }
  }

  async discard(): Promise<void> {
    await this.ngOnInit();
  }
}
