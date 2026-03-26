import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { PortalApiService } from "../../core/portal-api.service";
import { CrawlBrandSignals, WidgetPresetKey } from "../../core/models";
import { CockpitStore } from "../cockpit-store.service";

type WizardStep = "source" | "identity" | "knowledge" | "design" | "deploy";

interface DiscoveredPage {
  enabled: boolean;
  title: string;
  url: string;
}

interface WidgetThemeOption {
  accentColor: string;
  description: string;
  key: WidgetPresetKey;
  label: string;
  surfaceColor: string;
  textColor: string;
}

interface SiteProfile extends CrawlBrandSignals {
  baseUrl: string;
  description: string;
  sourceUrl: string;
  title: string;
}

@Component({
  selector: "app-bot-builder",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="ck-content">
      <div class="ck-page-header">
        <div>
          <h1 class="ck-page-header__title">{{ isNew ? "Setup Wizard" : "Edit Bot" }}</h1>
          <p class="ck-page-header__sub">
            {{ isNew ? "Guided onboarding from site analysis to deploy-ready embed." : "Legacy editing flow kept for compatibility." }}
          </p>
        </div>
        @if (!isNew) {
          <div class="ck-page-header__actions">
            <button class="ck-btn ck-btn--secondary ck-btn--sm" (click)="cancel()">Cancel</button>
            <button class="ck-btn ck-btn--primary ck-btn--sm" (click)="save()" [disabled]="saving">
              {{ saving ? "Saving…" : "Save Changes" }}
            </button>
          </div>
        }
      </div>

      @if (error) {
        <div class="ck-alert ck-alert--danger ck-mb-xl">{{ error }}</div>
      }
      @if (saved) {
        <div class="ck-alert ck-alert--success ck-mb-xl">Bot configuration saved.</div>
      }

      <div class="wizard-container" [class.is-new]="isNew">
        <aside class="wizard-sidebar" *ngIf="isNew">
          <div class="wizard-step" [class.active]="currentStep === 'source'" [class.completed]="isStepCompleted('source')">
            <div class="step-number">1</div>
            <div class="step-info">
              <p class="step-title">Knowledge Source</p>
              <p class="step-sub">Connect your website</p>
            </div>
          </div>
          <div class="wizard-step" [class.active]="currentStep === 'identity'" [class.completed]="isStepCompleted('identity')">
            <div class="step-number">2</div>
            <div class="step-info">
              <p class="step-title">AI Persona</p>
              <p class="step-sub">Name, tone and scope</p>
            </div>
          </div>
          <div class="wizard-step" [class.active]="currentStep === 'knowledge'" [class.completed]="isStepCompleted('knowledge')">
            <div class="step-number">3</div>
            <div class="step-info">
              <p class="step-title">Content Analysis</p>
              <p class="step-sub">Review discovered pages</p>
            </div>
          </div>
          <div class="wizard-step" [class.active]="currentStep === 'design'" [class.completed]="isStepCompleted('design')">
            <div class="step-number">4</div>
            <div class="step-info">
              <p class="step-title">Design & Behavior</p>
              <p class="step-sub">Choose a Talkaris preset</p>
            </div>
          </div>
          <div class="wizard-step" [class.active]="currentStep === 'deploy'" [class.completed]="isStepCompleted('deploy')">
            <div class="step-number">5</div>
            <div class="step-info">
              <p class="step-title">Deploy</p>
              <p class="step-sub">Embed and go live</p>
            </div>
          </div>
        </aside>

        <div class="wizard-content">
          <div class="wizard-view" [ngSwitch]="currentStep">
            <div *ngSwitchCase="'source'" class="fade-in">
              <h1 class="wizard-title">Where should your AI learn from?</h1>
              <p class="wizard-sub">Paste your site URL. Talkaris detects the sitemap first and falls back to root crawl when needed.</p>

              <div class="ck-card magic-card">
                <div class="ck-form-stack">
                  <div class="ck-field">
                    <label class="ck-label">Website URL</label>
                    <div class="ck-form-inline">
                      <input class="ck-input ck-grow" [(ngModel)]="sourceUrl" placeholder="https://example.com" />
                      <button class="ck-btn ck-btn--primary" (click)="analyzeSite()" [disabled]="analyzing || !sourceUrl.trim()">
                        {{ analyzing ? "Analyzing…" : "Analyze Site" }}
                      </button>
                    </div>
                  </div>
                  <p class="ck-text-sm ck-text-muted">Talkaris infers the bot identity, the domain allowlist and the canonical website ingestion path automatically.</p>
                </div>

                <div class="analysis-progress" *ngIf="analyzing || analysisLogs.length">
                  <progress class="ck-progress" max="100" [value]="analysisProgress"></progress>
                  <div class="analysis-log">
                    <p *ngFor="let log of analysisLogs" class="log-item">{{ log }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div *ngSwitchCase="'identity'" class="fade-in">
              <h1 class="wizard-title">Give your AI a personality</h1>
              <p class="wizard-sub">Define the operational identity your customers and operators will recognize instantly.</p>

              <div class="ck-grid-two">
                <div class="ck-card">
                  <div class="ck-form-stack">
                    <div class="ck-field">
                      <label class="ck-label">Workspace Project Name</label>
                      <input class="ck-input" [(ngModel)]="form.name" placeholder="Talkaris Support Assistant" />
                    </div>
                    <div class="ck-field">
                      <label class="ck-label">Assistant Name</label>
                      <input class="ck-input" [(ngModel)]="form.botName" placeholder="Nexus Assistant" />
                    </div>
                    <div class="ck-field">
                      <label class="ck-label">Allowed Domains</label>
                      <input class="ck-input" [(ngModel)]="form.allowedDomainsText" placeholder="example.com, app.example.com" />
                    </div>
                    <div class="ck-field">
                      <label class="ck-label">Tone of Voice</label>
                      <div class="tone-grid">
                        <button type="button" class="tone-card" [class.active]="form.promptTone === 'Professional'" (click)="form.promptTone = 'Professional'">Professional</button>
                        <button type="button" class="tone-card" [class.active]="form.promptTone === 'Friendly'" (click)="form.promptTone = 'Friendly'">Friendly</button>
                        <button type="button" class="tone-card" [class.active]="form.promptTone === 'Concise'" (click)="form.promptTone = 'Concise'">Concise</button>
                      </div>
                    </div>
                    <div class="ck-field">
                      <label class="ck-label">Welcome Message</label>
                      <textarea class="ck-textarea" [(ngModel)]="form.welcomeMessage" rows="4"></textarea>
                    </div>
                  </div>
                </div>

                <div class="ck-card preview-card">
                  <div class="preview-header">Live Preview</div>
                  <div class="chat-mockup">
                    <div class="chat-bubble bot">Hello, I'm {{ form.botName }}. {{ form.welcomeMessage }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div *ngSwitchCase="'knowledge'" class="fade-in">
              <h1 class="wizard-title">Review discovered content</h1>
              <p class="wizard-sub">Keep the pages that should feed the assistant and exclude the noise.</p>

              <div class="ck-card">
                <div class="page-list">
                  <div class="page-item" *ngFor="let page of discoveredPages">
                    <div class="page-info">
                      <span class="page-title">{{ page.title || page.url }}</span>
                      <span class="page-url">{{ page.url }}</span>
                    </div>
                    <input type="checkbox" [(ngModel)]="page.enabled" />
                  </div>
                </div>
              </div>
            </div>

            <div *ngSwitchCase="'design'" class="fade-in">
              <h1 class="wizard-title">Design your widget</h1>
              <p class="wizard-sub">Talkaris recommends one preset from the detected site signals and keeps two approved alternates ready for override.</p>

              @if (siteProfile) {
                <div class="ck-note ck-note--accent ck-mb-2xl">
                  <div class="ck-row-start">
                    @if (siteProfile.faviconUrl) {
                      <img [src]="siteProfile.faviconUrl" [alt]="siteProfile.siteName" class="ck-site-signal__icon" />
                    }
                    <div class="ck-stack-xs">
                      <strong>Adaptive recommendation for {{ siteProfile.siteName }}</strong>
                      <span class="ck-text-sm ck-text-soft">
                        {{ siteProfile.description || siteProfile.copyHints[0] || "Signals captured from the public website." }}
                      </span>
                      @if (siteProfile.dominantColors.length) {
                        <span class="ck-text-xs ck-text-muted">
                          Detected colors: {{ siteProfile.dominantColors.join(" · ") }}
                        </span>
                      }
                    </div>
                  </div>
                </div>
              }

              <div class="ck-grid-two">
                <div class="ck-card ck-stack-lg">
                  <div class="ck-field">
                    <label class="ck-label">Launcher Label</label>
                    <input class="ck-input" [(ngModel)]="form.launcherLabel" />
                  </div>

                  <div class="ck-field">
                    <label class="ck-label">Visual Preset</label>
                    <div class="ck-swatch-grid">
                      <button
                        *ngFor="let theme of widgetThemes"
                        type="button"
                        class="ck-widget-swatch"
                        [class.is-active]="theme.key === selectedThemeKey"
                        (click)="selectTheme(theme)"
                      >
                        <span class="ck-widget-swatch__chip" [ngClass]="swatchChipClass(theme.key)"></span>
                        <span class="ck-widget-swatch__badge" *ngIf="themeRecommendationLabel(theme.key) as label">
                          {{ label }}
                        </span>
                        <span class="ck-widget-swatch__label">{{ theme.label }}</span>
                        <span class="ck-text-sm ck-text-muted">{{ theme.description }}</span>
                      </button>
                    </div>
                  </div>

                  @if (hasLegacyAccentColor()) {
                    <p class="ck-note ck-note--accent">
                      This bot is using a legacy custom accent. Saving from here will normalize it to the selected Talkaris preset.
                    </p>
                  }
                </div>

                <div
                  class="ck-card ck-widget-preview"
                  [class.ck-widget-preview--indigo]="selectedTheme.key === 'indigo'"
                  [class.ck-widget-preview--violet]="selectedTheme.key === 'violet'"
                  [class.ck-widget-preview--midnight]="selectedTheme.key === 'midnight'"
                  [class.ck-widget-preview--aurora]="selectedTheme.key === 'aurora'"
                >
                  <div class="preview-header">Widget Preview</div>
                  <div class="ck-widget-preview__body">
                    <div class="chat-bubble bot">{{ previewMessage() }}</div>
                    <div class="ck-widget-preview__meta">
                      <span class="ck-badge ck-badge--accent">AI preset</span>
                      <span class="ck-badge ck-badge--default">{{ selectedTheme.label }}</span>
                      <span class="ck-badge ck-badge--default">{{ form.promptTone }}</span>
                      @if (siteProfile?.siteName) {
                        <span class="ck-badge ck-badge--default">{{ siteProfile?.siteName }}</span>
                      }
                    </div>
                  </div>
                  <div class="ck-widget-preview__launcher">
                    <div class="launcher-preview">{{ form.launcherLabel }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div *ngSwitchCase="'deploy'" class="fade-in">
              <h1 class="wizard-title">You’re all set</h1>
              <p class="wizard-sub">Copy the snippet once. The same embed works for Angular, Node/SSR, WordPress and plain HTML.</p>

              <div class="ck-card">
                <div class="ck-card__header">
                  <div>
                    <p class="ck-card__title">Embed Code</p>
                    <p class="ck-card__sub">Generated for <strong>{{ form.projectKey }}</strong></p>
                  </div>
                  <button class="ck-btn ck-btn--ghost ck-btn--sm" (click)="copyEmbed()" [disabled]="!snippetText">
                    {{ copiedEmbed ? "Copied" : "Copy Code" }}
                  </button>
                </div>
                <pre class="ck-code">{{ snippetText || "Generating snippet…" }}</pre>
              </div>

              <div class="ck-flow-inline ck-mt-3xl">
                <button class="ck-btn ck-btn--primary ck-btn--lg" (click)="finish()">Go to Dashboard</button>
                <a class="ck-btn ck-btn--secondary ck-btn--lg" [routerLink]="['/app/bots', form.projectKey, 'test']" *ngIf="form.projectKey">
                  Open Playground
                </a>
              </div>
            </div>
          </div>

          <div class="wizard-footer" *ngIf="isNew">
            <button class="ck-btn ck-btn--ghost" (click)="prevStep()" [disabled]="currentStep === 'source'">Back</button>
            <div class="spacer"></div>
            <button class="ck-btn ck-btn--primary" (click)="nextStep()" [disabled]="saving || analyzing">
              {{ currentStep === "deploy" ? "Finish" : "Next Step" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class BotBuilderComponent implements OnInit {
  readonly widgetThemes: WidgetThemeOption[] = [
    {
      key: "indigo",
      label: "Indigo Pulse",
      description: "Primary product action system.",
      accentColor: "#6366f1",
      surfaceColor: "#0f172a",
      textColor: "#f8fafc",
    },
    {
      key: "violet",
      label: "Violet Magic",
      description: "AI-first emphasis for premium copilots.",
      accentColor: "#8b5cf6",
      surfaceColor: "#111827",
      textColor: "#f8fafc",
    },
    {
      key: "midnight",
      label: "Midnight Slate",
      description: "Subtle, technical and low-noise.",
      accentColor: "#334155",
      surfaceColor: "#020617",
      textColor: "#f8fafc",
    },
    {
      key: "aurora",
      label: "Aurora Blend",
      description: "Balanced primary plus AI accent gradient.",
      accentColor: "#7c3aed",
      surfaceColor: "#0f172a",
      textColor: "#f8fafc",
    },
  ];

  isNew = true;
  currentStep: WizardStep = "source";
  completedSteps = new Set<WizardStep>();
  selectedThemeKey: WidgetThemeOption["key"] = "indigo";
  recommendedThemeKeys: WidgetThemeOption["key"][] = ["indigo", "violet", "midnight"];
  siteProfile: SiteProfile | null = null;

  saving = false;
  saved = false;
  error = "";
  snippetText = "";
  copiedEmbed = false;
  existingMetadata: Record<string, unknown> = {};

  sourceUrl = "";
  analyzing = false;
  analysisProgress = 0;
  analysisLogs: string[] = [];
  discoveredPages: DiscoveredPage[] = [];

  form = {
    projectKey: "",
    name: "",
    status: "active",
    botName: "Assistant",
    allowedDomainsText: "",
    welcomeMessage: "Hello! How can I help you today?",
    promptTone: "Professional",
    outOfScopeMessage: "",
    ctaPrimaryLabel: "Book a demo",
    ctaPrimaryUrl: "",
      launcherLabel: "Chat with us",
      accentColor: "#6366f1",
      surfaceColor: "#0f172a",
      textColor: "#f8fafc",
      presetKey: "indigo" as WidgetPresetKey,
    };

  constructor(
    private readonly store: CockpitStore,
    private readonly api: PortalApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  get selectedTheme(): WidgetThemeOption {
    return this.widgetThemes.find((theme) => theme.key === this.selectedThemeKey) ?? this.widgetThemes[0];
  }

  async ngOnInit(): Promise<void> {
    const botKey = this.route.snapshot.paramMap.get("botKey");
    if (botKey && botKey !== "new") {
      this.isNew = false;
      this.currentStep = "identity";
      await this.loadBot(botKey);
      return;
    }

    this.form.projectKey = `bot-${Math.random().toString(36).slice(2, 7)}`;
    this.selectTheme(this.selectedTheme);
  }

  isStepCompleted(step: WizardStep): boolean {
    return this.completedSteps.has(step);
  }

  swatchChipClass(key: WidgetThemeOption["key"]): string {
    return `ck-widget-swatch__chip--${key}`;
  }

  hasLegacyAccentColor(): boolean {
    return !this.widgetThemes.some((theme) => theme.accentColor.toLowerCase() === this.form.accentColor.toLowerCase());
  }

  selectTheme(theme: WidgetThemeOption): void {
    this.selectedThemeKey = theme.key;
    this.form.accentColor = theme.accentColor;
    this.form.surfaceColor = theme.surfaceColor;
    this.form.textColor = theme.textColor;
    this.form.presetKey = theme.key;
  }

  nextStep(): void {
    const steps: WizardStep[] = ["source", "identity", "knowledge", "design", "deploy"];
    const index = steps.indexOf(this.currentStep);
    if (index >= steps.length - 1) {
      this.finish();
      return;
    }
    this.completedSteps.add(this.currentStep);
    this.currentStep = steps[index + 1];
    if (this.currentStep === "deploy") {
      void this.save();
    }
  }

  prevStep(): void {
    const steps: WizardStep[] = ["source", "identity", "knowledge", "design", "deploy"];
    const index = steps.indexOf(this.currentStep);
    if (index > 0) {
      this.currentStep = steps[index - 1];
    }
  }

  async analyzeSite(): Promise<void> {
    if (!this.sourceUrl.trim()) return;
    const tenantId = this.store.activeTenantId();
    if (!tenantId) return;

    this.analyzing = true;
    this.error = "";
    this.analysisProgress = 10;
    this.analysisLogs = ["Initializing crawler", `Connecting to ${this.sourceUrl}`];

    try {
      const interval = setInterval(() => {
        if (this.analysisProgress < 90) this.analysisProgress += 5;
      }, 500);

      const result = await this.api.crawl(tenantId, this.form.projectKey, this.sourceUrl);

      clearInterval(interval);
      this.analysisProgress = 100;
      this.analysisLogs.push(`Discovered ${result.pages.length} pages`);
      if (result.brandSignals.siteName) {
        this.analysisLogs.push(`Detected brand profile for ${result.brandSignals.siteName}`);
      }
      this.analysisLogs.push("Knowledge extraction complete");

      this.discoveredPages = result.pages.map((url) => ({
        url,
        enabled: true,
        title: this.pageTitleFromUrl(url),
      }));
      this.siteProfile = {
        ...result.brandSignals,
        baseUrl: result.baseUrl,
        sourceUrl: this.sourceUrl,
        title: result.metadata?.title || result.brandSignals.siteName || this.sourceUrl,
        description: result.metadata?.description || result.brandSignals.copyHints[0] || "",
      };
      this.form.name = this.siteProfile.title;
      this.form.botName = this.defaultBotName(this.siteProfile.siteName || result.metadata?.title || this.sourceUrl);
      this.form.welcomeMessage = this.defaultWelcomeMessage(
        this.siteProfile.siteName || this.form.botName,
        this.siteProfile.language
      );
      this.form.allowedDomainsText = new URL(result.baseUrl || this.sourceUrl).hostname;
      if (this.form.projectKey.startsWith("bot-")) {
        this.form.projectKey = this.defaultProjectKey(this.siteProfile.siteName || this.form.name);
      }
      this.applyAdaptivePreset(result.brandSignals);

      setTimeout(() => {
        this.analyzing = false;
        this.nextStep();
      }, 700);
    } catch (error: any) {
      this.analyzing = false;
      this.error = `Failed to analyze site: ${error?.message ?? "Unknown error"}`;
    }
  }

  private resolveThemeKey(accentColor: string): WidgetThemeOption["key"] {
    const match = this.widgetThemes.find((theme) => theme.accentColor.toLowerCase() === accentColor.toLowerCase());
    return match?.key ?? "indigo";
  }

  themeRecommendationLabel(key: WidgetPresetKey): string {
    const rank = this.recommendedThemeKeys.indexOf(key);
    if (rank === 0) {
      return "Recommended";
    }
    if (rank === 1) {
      return "Alternate";
    }
    if (rank === 2) {
      return "Reserve";
    }
    return "";
  }

  previewMessage(): string {
    return (
      this.siteProfile?.copyHints[0]
      || "Talkaris copilots your operator flow with governed context and crisp answers."
    );
  }

  private async loadBot(projectKey: string): Promise<void> {
    const tenantId = this.store.activeTenantId();
    if (!tenantId) return;
    const bots = await this.api.tenantProjects(tenantId);
    const bot = bots.find((candidate) => candidate.projectKey === projectKey);
    if (!bot) return;
    this.existingMetadata = bot.metadata ?? {};

    this.form = {
      projectKey: bot.projectKey,
      name: bot.name,
      status: bot.status ?? "active",
      botName: bot.botName,
      allowedDomainsText: bot.allowedDomains.join(", "),
      welcomeMessage: bot.welcomeMessage,
      promptTone: bot.promptPolicy.tone,
      outOfScopeMessage: bot.promptPolicy.outOfScopeMessage ?? "",
      ctaPrimaryLabel: bot.ctaConfig.primaryLabel,
      ctaPrimaryUrl: bot.ctaConfig.primaryUrl,
      launcherLabel: bot.widgetTheme.launcherLabel,
      accentColor: bot.widgetTheme.accentColor,
      surfaceColor: bot.widgetTheme.surfaceColor,
      textColor: bot.widgetTheme.textColor,
      presetKey: bot.widgetTheme.presetKey ?? this.resolveThemeKey(bot.widgetTheme.accentColor),
    };
    const storedSiteProfile = (bot.metadata?.["siteProfile"] as Partial<SiteProfile> | undefined) ?? undefined;
    if (storedSiteProfile?.siteName) {
      this.siteProfile = {
        siteName: storedSiteProfile.siteName,
        logoUrl: storedSiteProfile.logoUrl ?? null,
        faviconUrl: storedSiteProfile.faviconUrl ?? null,
        dominantColors: storedSiteProfile.dominantColors ?? [],
        language: storedSiteProfile.language ?? bot.language,
        copyHints: storedSiteProfile.copyHints ?? [],
        baseUrl: storedSiteProfile.baseUrl ?? "",
        sourceUrl: storedSiteProfile.sourceUrl ?? "",
        title: storedSiteProfile.title ?? bot.name,
        description: storedSiteProfile.description ?? "",
      };
      this.applyAdaptivePreset(this.siteProfile, false);
    }
    this.selectedThemeKey = bot.widgetTheme.presetKey ?? this.resolveThemeKey(bot.widgetTheme.accentColor);
    await this.loadSnippet();
  }

  async save(): Promise<void> {
    const tenantId = this.store.activeTenantId();
    if (!tenantId) return;
    this.saving = true;
    this.error = "";

    try {
      await this.api.upsertTenantProject(tenantId, {
        projectKey: this.form.projectKey,
        name: this.form.name || this.form.botName,
        status: this.form.status,
        botName: this.form.botName,
        allowedDomains: this.form.allowedDomainsText
          .split(",")
          .map((domain) => domain.trim())
          .filter(Boolean),
        welcomeMessage: this.form.welcomeMessage,
        promptPolicy: {
          tone: this.form.promptTone,
          outOfScopeMessage: this.form.outOfScopeMessage,
        },
        ctaConfig: {
          primaryLabel: this.form.ctaPrimaryLabel,
          primaryUrl: this.form.ctaPrimaryUrl,
        },
        widgetTheme: {
          presetKey: this.form.presetKey,
          launcherLabel: this.form.launcherLabel,
          accentColor: this.form.accentColor,
          surfaceColor: this.form.surfaceColor,
          textColor: this.form.textColor,
        },
        metadata: {
          ...this.existingMetadata,
          ...this.buildProjectMetadata(),
        },
      });
      if (this.sourceUrl.trim()) {
        const website = await this.api.provisionWebsiteIntegration(tenantId, this.form.projectKey, this.sourceUrl);
        this.form.allowedDomainsText = website.allowedDomains.join(", ");
        this.snippetText = website.snippet;
      } else {
        await this.loadSnippet();
      }
      this.saved = true;
      setTimeout(() => {
        this.saved = false;
      }, 2500);
    } catch (error: any) {
      this.error = error?.message ?? "Failed to save.";
    } finally {
      this.saving = false;
    }
  }

  async loadSnippet(): Promise<void> {
    const tenantId = this.store.activeTenantId();
    if (!tenantId || !this.form.projectKey) return;
    try {
      const data = await this.api.projectSnippet(tenantId, this.form.projectKey);
      this.snippetText = data.snippet;
    } catch {
      this.snippetText = "";
    }
  }

  async copyEmbed(): Promise<void> {
    if (!this.snippetText) return;
    await navigator.clipboard.writeText(this.snippetText);
    this.copiedEmbed = true;
    setTimeout(() => {
      this.copiedEmbed = false;
    }, 1800);
  }

  finish(): void {
    void this.router.navigate(["/app/bots"]);
  }

  cancel(): void {
    void this.router.navigate(["/app/bots"]);
  }

  private applyAdaptivePreset(signals: CrawlBrandSignals, autoSelect = true): void {
    const ranked = this.widgetThemes
      .map((theme) => ({
        key: theme.key,
        score: this.themeScore(theme.key, signals),
      }))
      .sort((left, right) => right.score - left.score)
      .map((item) => item.key);

    this.recommendedThemeKeys = ranked;
    if (autoSelect) {
      const nextTheme = this.widgetThemes.find((theme) => theme.key === ranked[0]) ?? this.widgetThemes[0];
      this.selectTheme(nextTheme);
    }
  }

  private themeScore(key: WidgetPresetKey, signals: CrawlBrandSignals): number {
    const dominantColors = signals.dominantColors.map((color) => color.toLowerCase());
    const hints = signals.copyHints.join(" ").toLowerCase();
    const reference = {
      indigo: "#6366f1",
      violet: "#8b5cf6",
      midnight: "#334155",
      aurora: "#7c3aed",
    }[key];

    let score = dominantColors.length ? 0 : key === "indigo" ? 1 : 0;
    for (const color of dominantColors) {
      score += 1 - Math.min(this.colorDistance(reference, color) / 441, 1);
    }

    if (/(ai|automation|magic|intelligence|copilot)/.test(hints)) {
      score += key === "violet" || key === "aurora" ? 1.4 : 0;
    }
    if (/(security|ops|data|platform|cloud|infra)/.test(hints)) {
      score += key === "midnight" ? 1.2 : key === "indigo" ? 0.5 : 0;
    }
    if (/(support|sales|service|customer)/.test(hints)) {
      score += key === "indigo" ? 1 : 0.25;
    }

    return score;
  }

  private colorDistance(left: string, right: string): number {
    const [lr, lg, lb] = this.hexToRgb(left);
    const [rr, rg, rb] = this.hexToRgb(right);
    return Math.hypot(lr - rr, lg - rg, lb - rb);
  }

  private hexToRgb(color: string): [number, number, number] {
    const normalized = color.replace("#", "");
    if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
      return [99, 102, 241];
    }
    return [
      Number.parseInt(normalized.slice(0, 2), 16),
      Number.parseInt(normalized.slice(2, 4), 16),
      Number.parseInt(normalized.slice(4, 6), 16),
    ];
  }

  private pageTitleFromUrl(url: string): string {
    try {
      const pathname = new URL(url).pathname.replace(/\/$/, "");
      const lastSegment = pathname.split("/").filter(Boolean).pop();
      if (!lastSegment) {
        return "Homepage";
      }
      return lastSegment.replace(/[-_]+/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());
    } catch {
      return url;
    }
  }

  private defaultProjectKey(value: string): string {
    const base = value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 28);
    return base || `bot-${Math.random().toString(36).slice(2, 7)}`;
  }

  private defaultBotName(value: string): string {
    const cleaned = value.replace(/^https?:\/\//, "").replace(/^www\./, "").trim();
    return cleaned ? `${cleaned} Copilot` : "Talkaris Copilot";
  }

  private defaultWelcomeMessage(value: string, language = "en"): string {
    if (language.toLowerCase().startsWith("es")) {
      return `Hola, soy el copiloto de ${value}. Puedo orientar a cada visitante con respuestas gobernadas y el siguiente paso correcto.`;
    }

    return `Hello, I'm the ${value} copilot. I can guide visitors with governed answers and the right next step.`;
  }

  private buildProjectMetadata(): Record<string, unknown> {
    if (!this.siteProfile) {
      return {};
    }

    return {
      siteProfile: {
        ...this.siteProfile,
        selectedPages: this.discoveredPages.filter((page) => page.enabled).map((page) => page.url),
      },
    };
  }
}
