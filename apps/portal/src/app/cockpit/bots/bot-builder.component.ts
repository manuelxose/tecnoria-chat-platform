import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { CockpitStore } from "../cockpit-store.service";
import { PortalApiService } from "../../core/portal-api.service";
import { AiConfig, Project } from "../../core/models";

@Component({
  selector: "app-bot-builder",
  standalone: true,
  imports: [RouterModule, FormsModule],
  template: `
    <div class="ck-topbar">
      <div class="ck-topbar__breadcrumb">
        <a routerLink="/app/bots" style="color: var(--ck-text-muted); text-decoration: none;">Bots</a>
        <span>›</span>
        <strong>{{ isNew ? 'New Bot' : 'Edit Bot' }}</strong>
      </div>
      <div class="ck-topbar__actions">
        <button class="ck-btn ck-btn--secondary ck-btn--sm" (click)="cancel()">Cancel</button>
        <button class="ck-btn ck-btn--primary ck-btn--sm" (click)="save()" [disabled]="saving">
          {{ saving ? 'Saving…' : 'Save Bot' }}
        </button>
      </div>
    </div>

    <div class="ck-content">
      <div class="ck-page-header">
        <div>
          <h1 class="ck-page-header__title">{{ isNew ? 'Create Bot' : 'Edit Bot' }}</h1>
          <p class="ck-page-header__sub">{{ isNew ? 'Configure a new AI assistant' : 'Update bot configuration' }}</p>
        </div>
      </div>

      @if (error) {
        <div class="ck-alert ck-alert--danger" style="margin-bottom: 16px;">{{ error }}</div>
      }
      @if (saved) {
        <div class="ck-alert ck-alert--success" style="margin-bottom: 16px;">Bot saved successfully.</div>
      }

      <div class="ck-grid-sidebar">
        <!-- Left: Main config -->
        <div style="display: grid; gap: 16px;">
          <!-- Identity -->
          <div class="ck-card">
            <div class="ck-card__header">
              <p class="ck-card__title">Bot Identity</p>
            </div>
            <div class="ck-form-stack">
              <div class="ck-form-grid">
                <div class="ck-field">
                  <label class="ck-label">Project Key <span style="color: var(--ck-danger)">*</span></label>
                  <input class="ck-input" [(ngModel)]="form.projectKey" placeholder="my-bot" [disabled]="!isNew" />
                </div>
                <div class="ck-field">
                  <label class="ck-label">Display Name <span style="color: var(--ck-danger)">*</span></label>
                  <input class="ck-input" [(ngModel)]="form.name" placeholder="My AI Assistant" />
                </div>
              </div>
              <div class="ck-form-grid">
                <div class="ck-field">
                  <label class="ck-label">Bot Name</label>
                  <input class="ck-input" [(ngModel)]="form.botName" placeholder="Assistant" />
                </div>
                <div class="ck-field">
                  <label class="ck-label">Status</label>
                  <select class="ck-select" [(ngModel)]="form.status">
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>
              <div class="ck-field">
                <label class="ck-label">Allowed Domains</label>
                <input class="ck-input" [(ngModel)]="form.allowedDomainsText" placeholder="example.com, app.example.com" />
                <span style="font-size: 0.75rem; color: var(--ck-text-muted);">Comma-separated list of domains where this bot can be embedded.</span>
              </div>
              <div class="ck-field">
                <label class="ck-label">Welcome Message</label>
                <textarea class="ck-textarea" [(ngModel)]="form.welcomeMessage" rows="3" placeholder="Hello! How can I help you today?"></textarea>
              </div>
              <div class="ck-field">
                <label class="ck-label">Response Language</label>
                <select class="ck-select" [(ngModel)]="form.languageMode">
                  <option value="fixed">Fixed — use project language</option>
                  <option value="auto">Auto-detect visitor language</option>
                </select>
                <span style="font-size: 0.75rem; color: var(--ck-text-muted);">Auto-detect uses the visitor's browser language for bot responses.</span>
              </div>
            </div>
          </div>

          <!-- Prompt Policy -->
          <div class="ck-card">
            <div class="ck-card__header">
              <p class="ck-card__title">Prompt Policy</p>
              <p class="ck-card__sub">Controls how the AI responds</p>
            </div>
            <div class="ck-form-stack">
              <div class="ck-field">
                <label class="ck-label">Tone</label>
                <input class="ck-input" [(ngModel)]="form.promptTone" placeholder="Professional, friendly, concise" />
              </div>
              <div class="ck-field">
                <label class="ck-label">Out-of-scope message</label>
                <textarea class="ck-textarea" [(ngModel)]="form.outOfScopeMessage" rows="2"
                  placeholder="I can only answer questions about [topic]. For other inquiries, please contact us."></textarea>
              </div>
            </div>
          </div>

          <!-- AI Model Configuration -->
          @if (!isNew) {
            <div class="ck-card">
              <div class="ck-card__header">
                <p class="ck-card__title">AI Model</p>
                <p class="ck-card__sub">Override default LLM settings for this bot</p>
              </div>
              <div class="ck-form-stack">
                <div class="ck-form-grid">
                  <div class="ck-field">
                    <label class="ck-label">Provider</label>
                    <select class="ck-select" [(ngModel)]="aiForm.provider">
                      <option value="">Default (OpenAI)</option>
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="deepseek">DeepSeek</option>
                      <option value="google">Google Gemini</option>
                    </select>
                  </div>
                  <div class="ck-field">
                    <label class="ck-label">Model</label>
                    <input class="ck-input" [(ngModel)]="aiForm.model" placeholder="gpt-4o-mini" />
                  </div>
                </div>
                <div class="ck-form-grid">
                  <div class="ck-field">
                    <label class="ck-label">Temperature: {{ aiForm.temperature }}</label>
                    <input type="range" min="0" max="1" step="0.05" [(ngModel)]="aiForm.temperature" style="width: 100%;" />
                  </div>
                  <div class="ck-field">
                    <label class="ck-label">Max Tokens</label>
                    <input class="ck-input" type="number" [(ngModel)]="aiForm.maxTokens" placeholder="1024" min="256" max="4096" />
                  </div>
                </div>
                <div class="ck-field">
                  <label class="ck-label">Extra System Prompt</label>
                  <textarea class="ck-textarea" [(ngModel)]="aiForm.systemPromptAdditions" rows="3"
                    placeholder="Additional instructions appended to the system prompt…"></textarea>
                </div>
                <div style="display: flex; gap: 10px; align-items: center;">
                  <button class="ck-btn ck-btn--secondary ck-btn--sm" (click)="saveAiConfig()" [disabled]="savingAi">
                    {{ savingAi ? 'Saving…' : 'Save AI Config' }}
                  </button>
                  @if (savedAi) {
                    <span style="font-size: 0.82rem; color: var(--ck-accent-strong);">Saved!</span>
                  }
                </div>
              </div>
            </div>
          }

          <!-- CTA Configuration -->
          <div class="ck-card">
            <div class="ck-card__header">
              <p class="ck-card__title">Call-to-Action</p>
              <p class="ck-card__sub">Drive users to take action</p>
            </div>
            <div class="ck-form-stack">
              <div class="ck-form-grid">
                <div class="ck-field">
                  <label class="ck-label">Primary CTA Label</label>
                  <input class="ck-input" [(ngModel)]="form.ctaPrimaryLabel" placeholder="Book a demo" />
                </div>
                <div class="ck-field">
                  <label class="ck-label">Primary CTA URL</label>
                  <input class="ck-input" [(ngModel)]="form.ctaPrimaryUrl" placeholder="https://..." />
                </div>
              </div>
              <div class="ck-form-grid">
                <div class="ck-field">
                  <label class="ck-label">Secondary CTA Label</label>
                  <input class="ck-input" [(ngModel)]="form.ctaSecondaryLabel" placeholder="Learn more" />
                </div>
                <div class="ck-field">
                  <label class="ck-label">Secondary CTA URL</label>
                  <input class="ck-input" [(ngModel)]="form.ctaSecondaryUrl" placeholder="https://..." />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Widget theme + embed -->
        <div style="display: grid; gap: 16px; align-content: start;">
          <!-- Widget theme -->
          <div class="ck-card">
            <div class="ck-card__header">
              <p class="ck-card__title">Widget Theme</p>
            </div>
            <div class="ck-form-stack">
              <div class="ck-field">
                <label class="ck-label">Launcher Label</label>
                <input class="ck-input" [(ngModel)]="form.launcherLabel" placeholder="Chat with us" />
              </div>
              <div class="ck-form-grid">
                <div class="ck-field">
                  <label class="ck-label">Accent Color</label>
                  <input class="ck-input" [(ngModel)]="form.accentColor" placeholder="#6366f1" />
                </div>
                <div class="ck-field">
                  <label class="ck-label">Surface Color</label>
                  <input class="ck-input" [(ngModel)]="form.surfaceColor" placeholder="#0f1625" />
                </div>
              </div>
              <div class="ck-field">
                <label class="ck-label">Text Color</label>
                <input class="ck-input" [(ngModel)]="form.textColor" placeholder="#e2e8f0" />
              </div>
              <div class="ck-field">
                <label class="ck-label">Logo URL (optional)</label>
                <input class="ck-input" [(ngModel)]="form.logoUrl" placeholder="https://example.com/logo.png" />
                <span style="font-size: 0.75rem; color: var(--ck-text-muted);">Displayed in the widget header. Leave blank to show only the bot name.</span>
              </div>
              <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 4px 0;">
                <input type="checkbox" [(ngModel)]="form.removeBranding" />
                <span class="ck-label" style="margin: 0;">Remove Talkaris references from widget</span>
              </label>
              <div class="ck-field" style="margin-top: 12px;">
                <label class="ck-label">Proactive message (optional)</label>
                <input class="ck-input" [(ngModel)]="form.proactiveMessage" placeholder="¿Puedo ayudarte en algo?" />
                <span style="font-size: 0.75rem; color: var(--ck-text-muted);">Shown as a bubble above the launcher. Leave blank to disable.</span>
              </div>
              @if (form.proactiveMessage) {
                <div class="ck-field">
                  <label class="ck-label">Show after (seconds)</label>
                  <input class="ck-input" type="number" [(ngModel)]="form.proactiveDelaySeconds" placeholder="8" min="3" max="120" />
                </div>
              }
            </div>
          </div>

          <!-- Features -->
          @if (!isNew) {
            <div class="ck-card">
              <div class="ck-card__header">
                <p class="ck-card__title">Features</p>
              </div>
              <label style="display: flex; align-items: center; justify-content: space-between; cursor: pointer; padding: 6px 0;">
                <div>
                  <p style="font-size: 0.84rem; font-weight: 500; color: var(--ck-text); margin: 0;">Human Handover</p>
                  <p style="font-size: 0.78rem; color: var(--ck-text-muted); margin: 2px 0 0;">Show "Talk to a person" button in widget</p>
                </div>
                <input type="checkbox" [(ngModel)]="form.enableHandover" (ngModelChange)="saveFeatures()" />
              </label>
            </div>
          }

          <!-- Embed snippet -->
          @if (!isNew && snippetText) {
            <div class="ck-card">
              <div class="ck-card__header">
                <p class="ck-card__title">Embed Code</p>
                <button class="ck-btn ck-btn--ghost ck-btn--sm" (click)="copyEmbed()">
                  {{ copiedEmbed ? '✓ Copied' : 'Copy' }}
                </button>
              </div>
              <pre class="ck-code" style="font-size: 0.75rem;">{{ snippetText }}</pre>
            </div>
          }

          @if (!isNew && !snippetText) {
            <div class="ck-card">
              <div class="ck-card__header">
                <p class="ck-card__title">Embed Code</p>
              </div>
              <button class="ck-btn ck-btn--secondary" style="width: 100%;" (click)="loadSnippet()">
                Load Embed Snippet
              </button>
            </div>
          }

          <!-- Danger zone -->
          @if (!isNew) {
            <div class="ck-card" style="border-color: rgba(239, 68, 68, 0.2);">
              <div class="ck-card__header">
                <p class="ck-card__title" style="color: var(--ck-danger);">Danger Zone</p>
              </div>
              <p style="font-size: 0.84rem; color: var(--ck-text-muted); margin: 0 0 12px;">
                Disabling this bot will stop it from responding to new conversations.
              </p>
              <button class="ck-btn ck-btn--danger" (click)="disable()">
                Disable Bot
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class BotBuilderComponent implements OnInit {
  isNew = true;
  saving = false;
  saved = false;
  error = "";
  snippetText = "";
  copiedEmbed = false;
  savingAi = false;
  savedAi = false;
  aiForm: { provider: string; model: string; temperature: number; maxTokens: number; systemPromptAdditions: string } = {
    provider: "",
    model: "",
    temperature: 0.3,
    maxTokens: 1024,
    systemPromptAdditions: "",
  };

  form = {
    projectKey: "",
    name: "",
    status: "active",
    botName: "Assistant",
    allowedDomainsText: "",
    welcomeMessage: "",
    promptTone: "professional, helpful and concise",
    outOfScopeMessage: "",
    ctaPrimaryLabel: "Book a demo",
    ctaPrimaryUrl: "",
    ctaSecondaryLabel: "",
    ctaSecondaryUrl: "",
    launcherLabel: "Chat with us",
    accentColor: "#6366f1",
    surfaceColor: "#0f1625",
    textColor: "#e2e8f0",
    enableHandover: false,
    languageMode: "fixed" as "fixed" | "auto",
    logoUrl: "",
    removeBranding: false,
    proactiveMessage: "",
    proactiveDelaySeconds: 8,
  };

  constructor(
    private readonly store: CockpitStore,
    private readonly api: PortalApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    const botKey = this.route.snapshot.paramMap.get("botKey");
    if (botKey && botKey !== "new") {
      this.isNew = false;
      await this.loadBot(botKey);
      await this.loadAiConfig(botKey);
    }
  }

  private async loadBot(projectKey: string): Promise<void> {
    const tenantId = this.store.activeTenantId();
    if (!tenantId) return;
    const bots = await this.api.tenantProjects(tenantId);
    const bot = bots.find((b) => b.projectKey === projectKey);
    if (!bot) return;
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
      ctaSecondaryLabel: bot.ctaConfig.secondaryLabel ?? "",
      ctaSecondaryUrl: bot.ctaConfig.secondaryUrl ?? "",
      launcherLabel: bot.widgetTheme.launcherLabel,
      accentColor: bot.widgetTheme.accentColor,
      surfaceColor: bot.widgetTheme.surfaceColor,
      textColor: bot.widgetTheme.textColor,
      enableHandover: bot.enableHandover ?? false,
      languageMode: (bot.languageMode ?? "fixed") as "fixed" | "auto",
      logoUrl: bot.widgetTheme.logoUrl ?? "",
      removeBranding: bot.widgetTheme.removeBranding ?? false,
      proactiveMessage: bot.widgetTheme.proactiveMessage ?? "",
      proactiveDelaySeconds: bot.widgetTheme.proactiveDelaySeconds ?? 8,
    };
  }

  async save(): Promise<void> {
    const tenantId = this.store.activeTenantId();
    if (!tenantId) return;
    this.saving = true;
    this.error = "";
    try {
      await this.api.upsertTenantProject(tenantId, {
        projectKey: this.form.projectKey,
        name: this.form.name,
        status: this.form.status,
        botName: this.form.botName,
        allowedDomains: this.form.allowedDomainsText
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean),
        welcomeMessage: this.form.welcomeMessage,
        promptPolicy: {
          tone: this.form.promptTone,
          outOfScopeMessage: this.form.outOfScopeMessage,
        },
        ctaConfig: {
          primaryLabel: this.form.ctaPrimaryLabel,
          primaryUrl: this.form.ctaPrimaryUrl,
          secondaryLabel: this.form.ctaSecondaryLabel || undefined,
          secondaryUrl: this.form.ctaSecondaryUrl || undefined,
        },
        widgetTheme: {
          launcherLabel: this.form.launcherLabel,
          accentColor: this.form.accentColor,
          surfaceColor: this.form.surfaceColor,
          textColor: this.form.textColor,
          ...(this.form.logoUrl ? { logoUrl: this.form.logoUrl } : {}),
          removeBranding: this.form.removeBranding,
          ...(this.form.proactiveMessage ? {
            proactiveMessage: this.form.proactiveMessage,
            proactiveDelaySeconds: this.form.proactiveDelaySeconds ?? 8,
          } : {}),
        },
        languageMode: this.form.languageMode,
      });
      this.saved = true;
      if (this.isNew) {
        await this.router.navigate(["/app/bots"]);
      } else {
        setTimeout(() => (this.saved = false), 3000);
      }
    } catch (e: any) {
      this.error = e?.message ?? "Failed to save. Try again.";
    } finally {
      this.saving = false;
    }
  }

  async loadSnippet(): Promise<void> {
    const tenantId = this.store.activeTenantId();
    if (!tenantId || !this.form.projectKey) return;
    const data = await this.api.projectSnippet(tenantId, this.form.projectKey);
    this.snippetText = data.snippet;
  }

  async copyEmbed(): Promise<void> {
    await navigator.clipboard.writeText(this.snippetText);
    this.copiedEmbed = true;
    setTimeout(() => (this.copiedEmbed = false), 2000);
  }

  disable(): void {
    this.form.status = "disabled";
    this.save();
  }

  async saveFeatures(): Promise<void> {
    const tenantId = this.store.activeTenantId();
    if (!tenantId || !this.form.projectKey) return;
    await this.api.updateProjectFeatures(tenantId, this.form.projectKey, { enableHandover: this.form.enableHandover }).catch(() => {});
  }

  private async loadAiConfig(projectKey: string): Promise<void> {
    const tenantId = this.store.activeTenantId();
    if (!tenantId) return;
    try {
      const cfg = await this.api.getAiConfig(tenantId, projectKey);
      this.aiForm = {
        provider: cfg.provider ?? "",
        model: cfg.model ?? "",
        temperature: cfg.temperature ?? 0.3,
        maxTokens: cfg.maxTokens ?? 1024,
        systemPromptAdditions: cfg.systemPromptAdditions ?? "",
      };
    } catch { /* not found → leave defaults */ }
  }

  async saveAiConfig(): Promise<void> {
    const tenantId = this.store.activeTenantId();
    if (!tenantId || !this.form.projectKey) return;
    this.savingAi = true;
    try {
      await this.api.updateAiConfig(tenantId, this.form.projectKey, {
        provider: (this.aiForm.provider as AiConfig["provider"]) || undefined,
        model: this.aiForm.model || undefined,
        temperature: this.aiForm.temperature,
        maxTokens: this.aiForm.maxTokens,
        systemPromptAdditions: this.aiForm.systemPromptAdditions || undefined,
      });
      this.savedAi = true;
      setTimeout(() => (this.savedAi = false), 3000);
    } finally {
      this.savingAi = false;
    }
  }

  cancel(): void {
    this.router.navigate(["/app/bots"]);
  }
}
