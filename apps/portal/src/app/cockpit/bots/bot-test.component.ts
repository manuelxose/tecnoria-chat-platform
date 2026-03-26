import { CommonModule, DOCUMENT, isPlatformBrowser } from "@angular/common";
import { Component, Inject, OnInit, PLATFORM_ID } from "@angular/core";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { CockpitStore } from "../cockpit-store.service";
import { PortalApiService } from "../../core/portal-api.service";

@Component({
  selector: "app-bot-test",
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="ck-content">
      <div class="ck-page-header">
        <div>
          <h1 class="ck-page-header__title">Bot Playground</h1>
          <p class="ck-page-header__sub">
            This uses the same frame runtime as the embedded widget. No parallel test UI remains here.
          </p>
        </div>
        <div class="ck-page-header__actions">
          <a class="ck-btn ck-btn--secondary" [routerLink]="['/app/bots', botKey]">Back To Studio</a>
          <button class="ck-btn ck-btn--ghost" (click)="reloadRuntime()" [disabled]="!runtimeUrl">
            Reload Runtime
          </button>
        </div>
      </div>

      @if (error) {
        <div class="ck-alert ck-alert--danger ck-mb-xl">{{ error }}</div>
      }

      @if (!runtimeUrl && !loading) {
        <div class="ck-card">
          <div class="ck-empty">
            <div class="ck-empty__icon">◎</div>
            <p class="ck-empty__title">Runtime unavailable</p>
            <p class="ck-empty__sub">This bot could not be loaded for playground testing.</p>
          </div>
        </div>
      } @else {
        <div class="ck-grid-sidebar ck-grid-sidebar--playground">
          <div class="ck-card ck-stack-lg">
            <div class="ck-card__header">
              <div>
                <p class="ck-card__title">Runtime Contract</p>
                <p class="ck-card__sub">Saved bot config, live session flow and real conversation pipeline.</p>
              </div>
            </div>
            <div class="ck-kv-list">
              <div class="ck-kv-row">
                <span class="ck-kv-row__key">Bot</span>
                <span class="ck-kv-row__value">{{ projectLabel || botKey }}</span>
              </div>
              <div class="ck-kv-row">
                <span class="ck-kv-row__key">Site Key</span>
                <span class="ck-kv-row__value ck-table__cell--mono">{{ siteKey || "—" }}</span>
              </div>
              <div class="ck-kv-row">
                <span class="ck-kv-row__key">Mode</span>
                <span class="ck-kv-row__value">Canonical widget runtime</span>
              </div>
            </div>

            <div class="ck-alert ck-alert--info">
              Click the collapsed launcher to open the same runtime that your website snippet renders.
            </div>
          </div>

          <div class="ck-card ck-widget-preview ck-widget-preview--playground">
            <div class="preview-header">Live Runtime Playground</div>
            <div class="bot-studio-runtime-live__frame bot-studio-runtime-live__frame--playground">
              @if (runtimeUrl) {
                <iframe
                  class="bot-studio-runtime-live__iframe bot-studio-runtime-live__iframe--widget"
                  [src]="runtimeUrl"
                  title="Bot runtime playground"
                  loading="eager"
                ></iframe>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class BotTestComponent implements OnInit {
  botKey = "";
  siteKey = "";
  projectLabel = "";
  loading = true;
  error = "";
  runtimeUrl: SafeResourceUrl | null = null;

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(PLATFORM_ID) private readonly platformId: object,
    private readonly route: ActivatedRoute,
    readonly store: CockpitStore,
    private readonly api: PortalApiService,
    private readonly sanitizer: DomSanitizer,
  ) {}

  async ngOnInit(): Promise<void> {
    this.botKey = this.route.snapshot.paramMap.get("botKey") ?? "";
    const tenantId = this.store.activeTenantId();
    if (!tenantId || !this.botKey) {
      this.loading = false;
      return;
    }

    try {
      const project = await this.api.tenantProject(tenantId, this.botKey);
      this.siteKey = project.siteKey;
      this.projectLabel = project.botName || project.name;
      this.buildRuntimeUrl();
    } catch (error: any) {
      this.error = error?.message ?? "Failed to load playground runtime.";
    } finally {
      this.loading = false;
    }
  }

  reloadRuntime(): void {
    this.buildRuntimeUrl(true);
  }

  private buildRuntimeUrl(force = false): void {
    if (!isPlatformBrowser(this.platformId) || !this.siteKey) {
      this.runtimeUrl = null;
      return;
    }

    const origin = this.document.location.origin;
    const url = new URL(`${origin}/widget/frame.html`);
    url.searchParams.set("siteKey", this.siteKey);
    url.searchParams.set("apiBase", `${origin}/api`);
    url.searchParams.set("origin", origin);
    if (force) {
      url.searchParams.set("t", String(Date.now()));
    }
    this.runtimeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url.toString());
  }
}
