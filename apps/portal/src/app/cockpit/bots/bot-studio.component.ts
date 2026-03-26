import { CommonModule, DOCUMENT, isPlatformBrowser } from "@angular/common";
import { AfterViewInit, Component, DoCheck, ElementRef, Inject, OnDestroy, OnInit, PLATFORM_ID, ViewChild, effect } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import {
  AssistantProfile,
  AiConfig,
  ConversationItem,
  MessageItem,
  ProjectDetail,
  RuntimePolicy,
  WidgetButtonStyle,
  WidgetLauncherShape,
  WidgetPresetKey,
} from "../../core/models";
import { PortalApiService } from "../../core/portal-api.service";
import { CockpitStore } from "../cockpit-store.service";

type StudioSection = "identity" | "messaging" | "widget" | "conversion" | "operations" | "history" | "deploy";

interface WidgetThemeOption {
  accentColor: string;
  description: string;
  key: WidgetPresetKey;
  label: string;
  surfaceColor: string;
  textColor: string;
}

interface SiteProfile {
  siteName?: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  dominantColors?: string[];
  language?: string;
  copyHints?: string[];
  baseUrl?: string;
  sourceUrl?: string;
  title?: string;
  description?: string;
}

interface LauncherShapeOption {
  value: WidgetLauncherShape;
  label: string;
  description: string;
}

interface ButtonStyleOption {
  value: WidgetButtonStyle;
  label: string;
  description: string;
}

interface LogoUploadState {
  error: string;
  filename: string;
  uploading: boolean;
}

@Component({
  selector: "app-bot-studio",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="ck-content">
      @if (error) {
        <div class="ck-alert ck-alert--danger ck-mb-xl">{{ error }}</div>
      }
      @if (saved) {
        <div class="ck-alert ck-alert--success ck-mb-xl">Bot configuration saved.</div>
      }

      @if (loading) {
        <div class="ck-grid-sidebar bot-studio-layout">
          <div class="ck-stack-xl">
            <div class="ck-card">
              <div class="ck-skeleton ck-skeleton--xl ck-skeleton--mb-md"></div>
              <div class="ck-skeleton ck-skeleton--lg ck-skeleton--mb-md"></div>
              <div class="ck-skeleton ck-skeleton--2xl"></div>
            </div>
            <div class="ck-card">
              <div class="ck-skeleton ck-skeleton--xl ck-skeleton--mb-md"></div>
              <div class="ck-skeleton ck-skeleton--2xl ck-skeleton--mb-md"></div>
              <div class="ck-skeleton ck-skeleton--2xl"></div>
            </div>
          </div>
          <div class="ck-card">
            <div class="ck-skeleton ck-skeleton--2xl ck-skeleton--mb-md"></div>
            <div class="ck-skeleton ck-skeleton--2xl ck-skeleton--mb-md"></div>
            <div class="ck-skeleton ck-skeleton--2xl"></div>
          </div>
        </div>
      } @else {
        <div class="ck-page-header">
          <div>
            <h1 class="ck-page-header__title">Bot Studio</h1>
            <p class="ck-page-header__sub">Full-fidelity editing for runtime, conversion and AI behavior.</p>
          </div>
          <div class="ck-page-header__actions ck-flow-inline">
            <button class="ck-btn ck-btn--secondary" (click)="cancel()">Back</button>
            <span class="ck-badge ck-badge--default">{{ form.projectKey }}</span>
            <span class="ck-badge" [class]="statusBadge(form.status)">{{ form.status }}</span>
            <a class="ck-btn ck-btn--ghost ck-btn--sm" [routerLink]="['/app/bots', form.projectKey, 'test']">Playground</a>
            <button class="ck-btn ck-btn--primary" (click)="save()" [disabled]="loading || saving">
              {{ saving ? "Saving…" : "Save Changes" }}
            </button>
          </div>
        </div>

        <div class="ck-grid-sidebar bot-studio-layout">
          <div class="ck-stack-xl">
            <div class="ck-tabs bot-studio-tabs">
              <button type="button" class="ck-tab" [class.is-active]="section === 'identity'" (click)="section = 'identity'">Identity</button>
              <button type="button" class="ck-tab" [class.is-active]="section === 'messaging'" (click)="section = 'messaging'">Messaging</button>
              <button type="button" class="ck-tab" [class.is-active]="section === 'widget'" (click)="section = 'widget'">Widget</button>
              <button type="button" class="ck-tab" [class.is-active]="section === 'conversion'" (click)="section = 'conversion'">Conversion</button>
              <button type="button" class="ck-tab" [class.is-active]="section === 'operations'" (click)="section = 'operations'">Operations</button>
              <button type="button" class="ck-tab" [class.is-active]="section === 'history'" (click)="section = 'history'">History</button>
              <button type="button" class="ck-tab" [class.is-active]="section === 'deploy'" (click)="section = 'deploy'">Deploy</button>
            </div>

            @switch (section) {
              @case ("identity") {
                <div class="ck-card ck-stack-lg">
                  <div class="ck-card__header">
                    <div>
                      <p class="ck-card__title">Identity</p>
                      <p class="ck-card__sub">Canonical project identity and runtime-safe identifiers.</p>
                    </div>
                  </div>
                  <div class="ck-form-grid">
                    <div class="ck-field">
                      <label class="ck-label">Project Key</label>
                      <input class="ck-input ck-input--readonly" [value]="form.projectKey" readonly />
                    </div>
                    <div class="ck-field">
                      <label class="ck-label">Site Key</label>
                      <input class="ck-input ck-input--readonly" [value]="form.siteKey" readonly />
                    </div>
                  </div>
                  <div class="ck-form-grid">
                    <div class="ck-field">
                      <label class="ck-label">Workspace Project Name</label>
                      <input class="ck-input" [(ngModel)]="form.name" />
                    </div>
                    <div class="ck-field">
                      <label class="ck-label">Assistant Name</label>
                      <input class="ck-input" [(ngModel)]="form.botName" />
                    </div>
                  </div>
                  <div class="ck-form-grid ck-form-grid--three">
                    <div class="ck-field">
                      <label class="ck-label">Status</label>
                      <select class="ck-select" [(ngModel)]="form.status">
                        <option value="active">active</option>
                        <option value="draft">draft</option>
                        <option value="disabled">disabled</option>
                      </select>
                    </div>
                    <div class="ck-field">
                      <label class="ck-label">Language</label>
                      <select class="ck-select" [(ngModel)]="form.language">
                        <option value="es">es</option>
                        <option value="en">en</option>
                      </select>
                    </div>
                    <div class="ck-field">
                      <label class="ck-label">Language Mode</label>
                      <select class="ck-select" [(ngModel)]="form.languageMode">
                        <option value="fixed">fixed</option>
                        <option value="auto">auto</option>
                      </select>
                    </div>
                  </div>
                  <div class="ck-field">
                    <label class="ck-label">Allowed Domains</label>
                    <textarea class="ck-textarea" rows="3" [(ngModel)]="form.allowedDomainsText"></textarea>
                  </div>
                  <div class="ck-field">
                    <label class="ck-label">Public Base URL</label>
                    <input class="ck-input" [(ngModel)]="form.publicBaseUrl" placeholder="https://client.example.com" />
                  </div>
                </div>
              }

              @case ("messaging") {
                <div class="ck-card ck-stack-lg">
                  <div class="ck-card__header">
                    <div>
                      <p class="ck-card__title">Messaging</p>
                      <p class="ck-card__sub">Header copy, welcome bubble, guardrails and starter prompts.</p>
                    </div>
                    <button type="button" class="ck-btn ck-btn--ghost ck-btn--sm" (click)="applySuggestedStarters()">
                      Use Suggested Starters
                    </button>
                  </div>
                  <div class="ck-field">
                    <label class="ck-label">Welcome Message</label>
                    <textarea class="ck-textarea" rows="4" [(ngModel)]="form.welcomeMessage"></textarea>
                  </div>
                  <div class="ck-field">
                    <label class="ck-label">Header Bot Copy</label>
                    <textarea class="ck-textarea" rows="3" [(ngModel)]="form.botCopy"></textarea>
                  </div>
                  <div class="ck-field">
                    <label class="ck-label">Positioning Statement</label>
                    <textarea
                      class="ck-textarea"
                      rows="3"
                      [(ngModel)]="form.assistantPositioning"
                      placeholder="Asistente de preventa consultiva para software a medida, automatización e IA aplicada."
                    ></textarea>
                  </div>
                  <div class="ck-form-grid">
                    <div class="ck-field">
                      <label class="ck-label">Service Catalog</label>
                      <textarea
                        class="ck-textarea"
                        rows="5"
                        [(ngModel)]="form.assistantServicesText"
                        placeholder="One service per line"
                      ></textarea>
                    </div>
                    <div class="ck-field">
                      <label class="ck-label">Qualification Goals</label>
                      <textarea
                        class="ck-textarea"
                        rows="5"
                        [(ngModel)]="form.assistantQualificationGoalsText"
                        placeholder="One goal per line"
                      ></textarea>
                    </div>
                  </div>
                  <div class="ck-field">
                    <label class="ck-label">Good Next-Step Rules</label>
                    <textarea
                      class="ck-textarea"
                      rows="4"
                      [(ngModel)]="form.assistantNextStepRulesText"
                      placeholder="One rule per line"
                    ></textarea>
                  </div>
                  <div class="ck-form-grid">
                    <div class="ck-field">
                      <label class="ck-label">Prompt Tone</label>
                      <input class="ck-input" [(ngModel)]="form.promptTone" />
                    </div>
                    <div class="ck-field">
                      <label class="ck-label">Disallow Pricing</label>
                      <label class="ck-check-row">
                        <input class="ck-checkbox" type="checkbox" [(ngModel)]="form.disallowPricing" />
                        <span>Block pricing commitments in the assistant runtime.</span>
                      </label>
                    </div>
                  </div>
                  <div class="ck-field">
                    <label class="ck-label">Out of Scope Message</label>
                    <textarea class="ck-textarea" rows="4" [(ngModel)]="form.outOfScopeMessage"></textarea>
                  </div>
                  <div class="ck-field">
                    <label class="ck-label">Guardrails</label>
                    <textarea class="ck-textarea" rows="4" [(ngModel)]="form.guardrailsText" placeholder="One guardrail per line"></textarea>
                  </div>
                  <div class="ck-field">
                    <label class="ck-label">Starter Prompts</label>
                    <div class="ck-stack-sm">
                      <div class="ck-flow-inline ck-flow-inline--spread">
                        <span class="ck-text-sm ck-text-muted">
                          Add as many predefined phrases as you need for this bot runtime.
                        </span>
                        <button type="button" class="ck-btn ck-btn--ghost ck-btn--sm" (click)="addStarterQuestion()">
                          Add phrase
                        </button>
                      </div>
                      <div class="ck-form-stack">
                        @for (starter of form.starterQuestions; track $index) {
                          <div class="bot-studio-list-row">
                            <input
                              class="ck-input"
                              [ngModel]="starter"
                              (ngModelChange)="updateStarterQuestion($index, $event)"
                              placeholder="Suggested prompt"
                            />
                            <button
                              type="button"
                              class="ck-btn ck-btn--ghost ck-btn--sm"
                              (click)="removeStarterQuestion($index)"
                              [disabled]="form.starterQuestions.length <= 1"
                            >
                              Remove
                            </button>
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              }

              @case ("widget") {
                <div class="ck-card ck-stack-lg">
                  <div class="ck-card__header">
                    <div>
                      <p class="ck-card__title">Widget</p>
                      <p class="ck-card__sub">Preset, launcher, colors, button language and proactive behavior.</p>
                    </div>
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
                        <span class="ck-widget-swatch__label">{{ theme.label }}</span>
                        <span class="ck-text-sm ck-text-muted">{{ theme.description }}</span>
                      </button>
                    </div>
                  </div>
                  <div class="ck-form-grid">
                    <div class="ck-field">
                      <label class="ck-label">Launcher Label</label>
                      <input class="ck-input" [(ngModel)]="form.launcherLabel" />
                    </div>
                    <div class="ck-field">
                      <label class="ck-label">Launcher Eyebrow</label>
                      <input class="ck-input" [(ngModel)]="form.launcherEyebrow" placeholder="TecnoRia" />
                    </div>
                  </div>
                  <div class="ck-form-grid ck-form-grid--three">
                    <div class="ck-field">
                      <label class="ck-label">Launcher Shape</label>
                      <select class="ck-select" [(ngModel)]="form.launcherShape">
                        @for (shape of launcherShapes; track shape.value) {
                          <option [value]="shape.value">{{ shape.label }}</option>
                        }
                      </select>
                      <span class="ck-text-xs ck-text-muted">{{ selectedLauncherShape.description }}</span>
                    </div>
                    <div class="ck-field">
                      <label class="ck-label">Launcher Icon / Emoji</label>
                      <input class="ck-input" [(ngModel)]="form.launcherIcon" placeholder="💬" maxlength="4" />
                    </div>
                    <div class="ck-field">
                      <label class="ck-label">Logo URL</label>
                      <input class="ck-input" [(ngModel)]="form.logoUrl" placeholder="https://..." />
                    </div>
                  </div>
                  <div class="ck-field">
                    <label class="ck-label">Upload Logo</label>
                    <div class="ck-upload-row">
                      <input
                        #logoUploadInput
                        class="ck-input"
                        type="file"
                        accept=".svg,.png,.jpg,.jpeg,.webp,image/svg+xml,image/png,image/jpeg,image/webp"
                        (change)="onLogoSelected($event)"
                      />
                      <button
                        type="button"
                        class="ck-btn ck-btn--secondary ck-btn--sm"
                        (click)="uploadLogo()"
                        [disabled]="!logoUpload.filename || logoUpload.uploading"
                      >
                        {{ logoUpload.uploading ? "Uploading…" : "Upload Logo" }}
                      </button>
                    </div>
                    @if (logoUpload.filename) {
                      <span class="ck-text-xs ck-text-soft">Selected: {{ logoUpload.filename }}</span>
                    }
                    @if (logoUpload.error) {
                      <span class="ck-text-xs ck-text-danger">{{ logoUpload.error }}</span>
                    }
                  </div>
                  <div class="ck-form-grid ck-form-grid--three">
                    <div class="ck-field">
                      <label class="ck-label">Button Style</label>
                      <select class="ck-select" [(ngModel)]="form.buttonStyle">
                        @for (style of buttonStyles; track style.value) {
                          <option [value]="style.value">{{ style.label }}</option>
                        }
                      </select>
                      <span class="ck-text-xs ck-text-muted">{{ selectedButtonStyle.description }}</span>
                    </div>
                    <div class="ck-field">
                      <label class="ck-label">Send Button Label</label>
                      <input class="ck-input" [(ngModel)]="form.sendButtonLabel" placeholder="Enviar" />
                    </div>
                    <div class="ck-field">
                      <label class="ck-label">Composer Placeholder</label>
                      <input class="ck-input" [(ngModel)]="form.composerPlaceholder" placeholder="Pregunta a tu asistente..." />
                    </div>
                  </div>
                  <div class="ck-form-grid ck-form-grid--three">
                    <div class="ck-field">
                      <label class="ck-label">Accent Color</label>
                      <div class="ck-color-field">
                        <input class="ck-color-picker" type="color" [(ngModel)]="form.accentColor" />
                        <input class="ck-input" [(ngModel)]="form.accentColor" placeholder="#6366f1" />
                      </div>
                    </div>
                    <div class="ck-field">
                      <label class="ck-label">Surface Color</label>
                      <div class="ck-color-field">
                        <input class="ck-color-picker" type="color" [(ngModel)]="form.surfaceColor" />
                        <input class="ck-input" [(ngModel)]="form.surfaceColor" placeholder="#0f172a" />
                      </div>
                    </div>
                    <div class="ck-field">
                      <label class="ck-label">Text Color</label>
                      <div class="ck-color-field">
                        <input class="ck-color-picker" type="color" [(ngModel)]="form.textColor" />
                        <input class="ck-input" [(ngModel)]="form.textColor" placeholder="#f8fafc" />
                      </div>
                    </div>
                  </div>
                  <div class="ck-form-grid">
                    <div class="ck-field">
                      <label class="ck-label">Proactive Message</label>
                      <input class="ck-input" [(ngModel)]="form.proactiveMessage" />
                    </div>
                    <div class="ck-field">
                      <label class="ck-label">Proactive Delay Seconds</label>
                      <input class="ck-input" type="number" min="0" max="120" [(ngModel)]="form.proactiveDelaySeconds" />
                    </div>
                  </div>
                  <div class="ck-field">
                    <label class="ck-label">Widget Surface Controls</label>
                    <div class="ck-stack-sm">
                      <label class="ck-check-row">
                        <input class="ck-checkbox" type="checkbox" [(ngModel)]="form.removeBranding" />
                        <span>Remove Talkaris footer branding in the runtime widget.</span>
                      </label>
                    </div>
                  </div>
                </div>
              }

              @case ("conversion") {
                <div class="ck-card ck-stack-lg">
                  <div class="ck-card__header">
                    <div>
                      <p class="ck-card__title">Conversion</p>
                      <p class="ck-card__sub">Primary and secondary CTA plus commercial intent keywords.</p>
                    </div>
                  </div>
                  <div class="ck-form-grid">
                    <div class="ck-field">
                      <label class="ck-label">Primary CTA Label</label>
                      <input class="ck-input" [(ngModel)]="form.ctaPrimaryLabel" />
                    </div>
                    <div class="ck-field">
                      <label class="ck-label">Primary CTA URL</label>
                      <input class="ck-input" [(ngModel)]="form.ctaPrimaryUrl" />
                    </div>
                  </div>
                  <div class="ck-form-grid">
                    <div class="ck-field">
                      <label class="ck-label">Secondary CTA Label</label>
                      <input class="ck-input" [(ngModel)]="form.ctaSecondaryLabel" />
                    </div>
                    <div class="ck-field">
                      <label class="ck-label">Secondary CTA URL</label>
                      <input class="ck-input" [(ngModel)]="form.ctaSecondaryUrl" />
                    </div>
                  </div>
                  <div class="ck-field">
                    <label class="ck-label">Sales Keywords</label>
                    <textarea class="ck-textarea" rows="4" [(ngModel)]="form.salesKeywordsText" placeholder="precio, demo, contacto"></textarea>
                  </div>
                </div>
              }

              @case ("operations") {
                <div class="ck-card ck-stack-lg">
                  <div class="ck-card__header">
                    <div>
                      <p class="ck-card__title">Operations</p>
                      <p class="ck-card__sub">Runtime policy, handover and LLM controls.</p>
                    </div>
                  </div>
                  <div class="ck-form-grid ck-form-grid--three">
                    <div class="ck-field">
                      <label class="ck-label">Assistant Posture</label>
                      <input class="ck-input" [(ngModel)]="form.runtimePosture" />
                    </div>
                    <div class="ck-field">
                      <label class="ck-label">Scope</label>
                      <input class="ck-input" [(ngModel)]="form.runtimeScope" />
                    </div>
                    <div class="ck-field">
                      <label class="ck-label">Roadmap Depth</label>
                      <input class="ck-input" [(ngModel)]="form.runtimeRoadmapDepth" />
                    </div>
                  </div>
                  <div class="ck-form-grid ck-form-grid--three">
                    <div class="ck-field">
                      <label class="ck-label">Mobile Suggestions</label>
                      <input class="ck-input" type="number" min="1" max="2" [(ngModel)]="form.runtimeMobileSuggestions" />
                    </div>
                    <div class="ck-field">
                      <label class="ck-label">Desktop Suggestions</label>
                      <input class="ck-input" type="number" min="1" max="3" [(ngModel)]="form.runtimeDesktopSuggestions" />
                    </div>
                    <div class="ck-field">
                      <label class="ck-label">Commercial Intent Threshold</label>
                      <input class="ck-input" type="number" min="1" max="5" [(ngModel)]="form.runtimeCommercialIntentThreshold" />
                    </div>
                  </div>
                  <div class="ck-field">
                    <label class="ck-label">Runtime Starter Policy</label>
                    <label class="ck-check-row">
                      <input class="ck-checkbox" type="checkbox" [(ngModel)]="form.runtimeHideStartersAfterFirstUserMessage" />
                      <span>Hide starter prompts after the first real user message and let contextual suggestions take over.</span>
                    </label>
                  </div>
                  <div class="ck-field">
                    <label class="ck-label">Live Handover</label>
                    <label class="ck-check-row">
                      <input class="ck-checkbox" type="checkbox" [(ngModel)]="form.enableHandover" />
                      <span>Allow the widget to escalate a conversation to a human operator.</span>
                    </label>
                  </div>
                  <div class="ck-form-grid ck-form-grid--three">
                    <div class="ck-field">
                      <label class="ck-label">AI Provider</label>
                      <select class="ck-select" [(ngModel)]="form.aiProvider">
                        <option value="deepseek">deepseek</option>
                        <option value="openai">openai</option>
                        <option value="anthropic">anthropic</option>
                        <option value="google">google</option>
                        <option value="local">local</option>
                      </select>
                    </div>
                    <div class="ck-field">
                      <label class="ck-label">Model</label>
                      <input class="ck-input" [(ngModel)]="form.aiModel" />
                    </div>
                    <div class="ck-field">
                      <label class="ck-label">Temperature</label>
                      <input class="ck-input" type="number" step="0.1" min="0" max="2" [(ngModel)]="form.aiTemperature" />
                    </div>
                  </div>
                  <div class="ck-form-grid">
                    <div class="ck-field">
                      <label class="ck-label">Max Tokens</label>
                      <input class="ck-input" type="number" min="1" max="8000" [(ngModel)]="form.aiMaxTokens" />
                    </div>
                    <div class="ck-field">
                      <label class="ck-label">System Prompt Additions</label>
                      <textarea class="ck-textarea" rows="3" [(ngModel)]="form.aiSystemPromptAdditions"></textarea>
                    </div>
                  </div>
                </div>
              }

              @case ("history") {
                <div class="ck-card ck-stack-lg">
                  <div class="ck-card__header">
                    <div>
                      <p class="ck-card__title">Bot Conversation History</p>
                      <p class="ck-card__sub">Recent conversations filtered to this bot only.</p>
                    </div>
                    <a
                      class="ck-btn ck-btn--ghost ck-btn--sm"
                      [routerLink]="['/app/conversations']"
                      [queryParams]="{ projectKey: form.projectKey }"
                    >
                      Open Full History
                    </a>
                  </div>
                  @if (loadingHistory) {
                    <div class="ck-stack-sm">
                      @for (i of [1,2,3,4]; track i) {
                        <div class="ck-skeleton ck-skeleton--lg"></div>
                      }
                    </div>
                  } @else if (conversationHistory.length) {
                    <div class="ck-stack-md">
                      @for (conversation of conversationHistory; track conversation.id) {
                        <button
                          type="button"
                          class="ck-history-card"
                          [class.is-active]="selectedConversationId === conversation.id"
                          (click)="inspectConversation(conversation.id)"
                        >
                          <div class="ck-history-card__top">
                            <div class="ck-flow-inline">
                              <span class="ck-badge ck-badge--default ck-table__cell--mono">
                                {{ conversation.id.slice(0, 8) }}…
                              </span>
                              <span class="ck-badge" [class]="channelBadge(conversation.channelKind)">
                                {{ conversation.channelKind || "widget" }}
                              </span>
                            </div>
                            <span class="ck-text-xs ck-text-muted">
                              {{ conversation.lastMessageAt ? (conversation.lastMessageAt | date: 'MMM d, HH:mm') : '—' }}
                            </span>
                          </div>
                          <div class="ck-history-card__body">
                            <strong>{{ conversation.contactLabel || "Website session" }}</strong>
                            <span class="ck-text-sm ck-text-soft">
                              {{ conversation.lastMessagePreview || "No message excerpt available yet." }}
                            </span>
                          </div>
                          <div class="ck-history-card__meta">
                            <span>{{ conversation.messageCount }} messages</span>
                            <span>Started {{ conversation.createdAt | date: 'MMM d, HH:mm' }}</span>
                          </div>
                        </button>
                      }
                    </div>

                    @if (selectedConversationId) {
                      <div class="ck-card ck-card--compact ck-stack-md">
                        <div class="ck-card__header">
                          <div>
                            <p class="ck-card__title">Conversation Transcript</p>
                            <p class="ck-card__sub ck-table__cell--mono">{{ selectedConversationId }}</p>
                          </div>
                          <a class="ck-btn ck-btn--ghost ck-btn--sm" [routerLink]="['/app/conversations', selectedConversationId]">
                            Open Full Detail
                          </a>
                        </div>

                        @if (loadingConversationDetail) {
                          <div class="ck-stack-sm">
                            @for (i of [1,2,3]; track i) {
                              <div class="ck-skeleton ck-skeleton--lg"></div>
                            }
                          </div>
                        } @else if (selectedConversationMessages.length) {
                          <div class="ck-history-thread">
                            @for (message of selectedConversationMessages; track message.id) {
                              <div [class]="message.role === 'user' ? 'ck-chat-msg--user' : 'ck-chat-msg--bot'">
                                <div [class]="message.role === 'user' ? 'ck-chat-bubble--user chat-bubble' : 'ck-chat-bubble--bot chat-bubble'">
                                  {{ message.body }}
                                </div>
                                <div class="ck-chat-meta">
                                  <span class="ck-badge" [class]="roleBadge(message.role)">{{ message.role }}</span>
                                  <span class="ck-text-xs ck-text-muted">{{ message.createdAt | date: 'HH:mm:ss' }}</span>
                                  @if (message.confidence !== null && message.confidence !== undefined && message.role === 'assistant') {
                                    <span class="ck-text-xs ck-text-muted">Confidence {{ (message.confidence * 100).toFixed(0) }}%</span>
                                  }
                                </div>
                                @if (message.citations?.length) {
                                  <div class="ck-chat-citations">
                                    @for (citation of message.citations; track citation.url) {
                                      <a class="ck-link-subtle" [href]="citation.url" target="_blank" rel="noopener">
                                        {{ citation.title }}
                                      </a>
                                    }
                                  </div>
                                }
                              </div>
                            }
                          </div>
                        } @else {
                          <div class="ck-empty">
                            <div class="ck-empty__icon">◎</div>
                            <p class="ck-empty__title">No transcript loaded</p>
                            <p class="ck-empty__sub">This conversation has no visible messages yet.</p>
                          </div>
                        }
                      </div>
                    }
                  } @else {
                    <div class="ck-empty">
                      <div class="ck-empty__icon">◎</div>
                      <p class="ck-empty__title">No conversations for this bot yet</p>
                      <p class="ck-empty__sub">History will appear here as soon as this bot starts serving users.</p>
                    </div>
                  }
                </div>
              }

              @case ("deploy") {
                <div class="ck-card ck-stack-lg">
                  <div class="ck-card__header">
                    <div>
                      <p class="ck-card__title">Deploy</p>
                      <p class="ck-card__sub">Snippet, runtime identifiers and current embed contract.</p>
                    </div>
                    <button class="ck-btn ck-btn--ghost ck-btn--sm" (click)="copyEmbed()" [disabled]="!snippetText">
                      {{ copiedEmbed ? "Copied" : "Copy Snippet" }}
                    </button>
                  </div>
                  <div class="ck-form-grid">
                    <div class="ck-field">
                      <label class="ck-label">Project Key</label>
                      <input class="ck-input ck-input--readonly" [value]="form.projectKey" readonly />
                    </div>
                    <div class="ck-field">
                      <label class="ck-label">Site Key</label>
                      <input class="ck-input ck-input--readonly" [value]="form.siteKey" readonly />
                    </div>
                  </div>
                  <pre class="ck-code">{{ snippetText || "Generating snippet…" }}</pre>
                  <div class="ck-flow-inline">
                    <a class="ck-btn ck-btn--primary" [routerLink]="['/app/bots', form.projectKey, 'test']">Open Playground</a>
                    <button class="ck-btn ck-btn--secondary" (click)="save()" [disabled]="saving">
                      {{ saving ? "Saving…" : "Save Before Deploy" }}
                    </button>
                  </div>
                </div>
              }
            }
          </div>

          <div class="ck-stack-lg">
            <div
              class="ck-card ck-widget-preview"
              [class.ck-widget-preview--indigo]="selectedTheme.key === 'indigo'"
              [class.ck-widget-preview--violet]="selectedTheme.key === 'violet'"
              [class.ck-widget-preview--midnight]="selectedTheme.key === 'midnight'"
              [class.ck-widget-preview--aurora]="selectedTheme.key === 'aurora'"
            >
              <div class="preview-header">Runtime Preview</div>
              <div class="bot-studio-runtime-live">
                <div class="bot-studio-runtime-live__section">
                  <div class="bot-studio-runtime-live__section-head">
                    <span class="bot-studio-runtime-live__label">Open runtime</span>
                    <span class="bot-studio-runtime-live__hint">Live widget state</span>
                  </div>
                  <div class="bot-studio-runtime-live__frame">
                    @if (previewWidgetUrl) {
                      <iframe
                        #widgetPreviewFrame
                        class="bot-studio-runtime-live__iframe bot-studio-runtime-live__iframe--widget"
                        [src]="previewWidgetUrl"
                        title="Runtime widget preview"
                        loading="eager"
                        (load)="pushPreviewConfig(true)"
                      ></iframe>
                    }
                  </div>
                </div>
                <div class="ck-widget-preview__meta">
                  <span class="ck-badge ck-badge--default">{{ selectedTheme.label }}</span>
                  <span class="ck-badge ck-badge--default">{{ selectedLauncherShape.label }}</span>
                  <span class="ck-badge ck-badge--default">{{ selectedButtonStyle.label }}</span>
                  <span class="ck-badge ck-badge--default">{{ resolvedStarterQuestions().length }} starters</span>
                  @if (form.enableHandover) {
                    <span class="ck-badge ck-badge--accent">handover</span>
                  }
                  @if (form.removeBranding) {
                    <span class="ck-badge ck-badge--default">whitelabel</span>
                  }
                </div>

                <div class="bot-studio-runtime-live__section">
                  <div class="bot-studio-runtime-live__section-head">
                    <span class="bot-studio-runtime-live__label">Collapsed launcher</span>
                    <span class="bot-studio-runtime-live__hint">Brand trigger state</span>
                  </div>
                  <div class="bot-studio-runtime-live__launcher">
                    @if (previewLauncherUrl) {
                      <iframe
                        #launcherPreviewFrame
                        class="bot-studio-runtime-live__iframe bot-studio-runtime-live__iframe--launcher"
                        [src]="previewLauncherUrl"
                        title="Launcher preview"
                        loading="eager"
                        (load)="pushPreviewConfig(true)"
                      ></iframe>
                    }
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      }
    </div>
  `,
})
export class BotStudioComponent implements OnInit, AfterViewInit, DoCheck, OnDestroy {
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
  readonly launcherShapes: LauncherShapeOption[] = [
    { value: "pill", label: "Pill", description: "Wide launcher with eyebrow and label." },
    { value: "rounded", label: "Rounded", description: "Softer block with more card presence." },
    { value: "compact", label: "Compact", description: "Tighter launcher for smaller layouts." },
  ];
  readonly buttonStyles: ButtonStyleOption[] = [
    { value: "solid", label: "Solid", description: "High-contrast gradient CTA." },
    { value: "glass", label: "Glass", description: "Frosted button surfaces with subtle emphasis." },
    { value: "outline", label: "Outline", description: "Minimal low-noise buttons." },
  ];

  botKey = "";
  @ViewChild("widgetPreviewFrame") widgetPreviewFrame?: ElementRef<HTMLIFrameElement>;
  @ViewChild("launcherPreviewFrame") launcherPreviewFrame?: ElementRef<HTMLIFrameElement>;
  @ViewChild("logoUploadInput") logoUploadInput?: ElementRef<HTMLInputElement>;

  section: StudioSection = "identity";
  selectedThemeKey: WidgetPresetKey = "indigo";
  loading = true;
  saving = false;
  saved = false;
  error = "";
  copiedEmbed = false;
  snippetText = "";
  siteProfile: SiteProfile | null = null;
  starterSuggestions: string[] = [];
  conversationHistory: ConversationItem[] = [];
  loadingHistory = true;
  selectedConversationId = "";
  selectedConversationMessages: MessageItem[] = [];
  loadingConversationDetail = false;
  previewWidgetUrl: SafeResourceUrl | null = null;
  previewLauncherUrl: SafeResourceUrl | null = null;
  private lastPreviewPayload = "";
  private readonly isBrowser: boolean;
  private pendingLogoFile: File | null = null;

  logoUpload: LogoUploadState = {
    error: "",
    filename: "",
    uploading: false,
  };

  form = {
    projectKey: "",
    siteKey: "",
    name: "",
    status: "active" as "active" | "draft" | "disabled",
    language: "es",
    languageMode: "fixed" as "fixed" | "auto",
    allowedDomainsText: "",
    publicBaseUrl: "",
    botName: "",
    welcomeMessage: "",
    botCopy: "",
    assistantPositioning: "",
    assistantServicesText: "",
    assistantQualificationGoalsText: "",
    assistantNextStepRulesText: "",
    promptTone: "",
    outOfScopeMessage: "",
    guardrailsText: "",
    disallowPricing: true,
    launcherLabel: "",
    launcherEyebrow: "",
    launcherIcon: "",
    launcherShape: "pill" as WidgetLauncherShape,
    buttonStyle: "solid" as WidgetButtonStyle,
    accentColor: "#6366f1",
    surfaceColor: "#0f172a",
    textColor: "#f8fafc",
    presetKey: "indigo" as WidgetPresetKey,
    logoUrl: "",
    removeBranding: false,
    proactiveMessage: "",
    proactiveDelaySeconds: 8,
    composerPlaceholder: "",
    sendButtonLabel: "",
    ctaPrimaryLabel: "",
    ctaPrimaryUrl: "",
    ctaSecondaryLabel: "",
    ctaSecondaryUrl: "",
    salesKeywordsText: "",
    enableHandover: false,
    aiProvider: "deepseek" as NonNullable<AiConfig["provider"]>,
    aiModel: "",
    aiTemperature: 0.3,
    aiMaxTokens: 600,
    aiSystemPromptAdditions: "",
    runtimePosture: "",
    runtimeScope: "",
    runtimeRoadmapDepth: "",
    runtimeMobileSuggestions: 2,
    runtimeDesktopSuggestions: 3,
    runtimeCommercialIntentThreshold: 1,
    runtimeHideStartersAfterFirstUserMessage: true,
    starterQuestions: [""],
  };

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    @Inject(PLATFORM_ID) platformId: object,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly store: CockpitStore,
    private readonly api: PortalApiService,
    private readonly sanitizer: DomSanitizer,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.botKey = this.route.snapshot.paramMap.get("botKey") ?? "";
    effect(() => {
      const tenantId = this.store.activeTenantId();
      if (tenantId && this.botKey) {
        void this.load(tenantId, this.botKey);
      }
    });
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.pushPreviewConfig(true);
  }

  ngDoCheck(): void {
    this.pushPreviewConfig();
  }

  ngOnDestroy(): void {}

  get selectedTheme(): WidgetThemeOption {
    return this.widgetThemes.find((theme) => theme.key === this.selectedThemeKey) ?? this.widgetThemes[0];
  }

  get selectedLauncherShape(): LauncherShapeOption {
    return this.launcherShapes.find((shape) => shape.value === this.form.launcherShape) ?? this.launcherShapes[0];
  }

  get selectedButtonStyle(): ButtonStyleOption {
    return this.buttonStyles.find((style) => style.value === this.form.buttonStyle) ?? this.buttonStyles[0];
  }

  swatchChipClass(key: WidgetPresetKey): string {
    return `ck-widget-swatch__chip--${key}`;
  }

  selectTheme(theme: WidgetThemeOption): void {
    this.selectedThemeKey = theme.key;
    this.form.presetKey = theme.key;
    this.form.accentColor = theme.accentColor;
    this.form.surfaceColor = theme.surfaceColor;
    this.form.textColor = theme.textColor;
  }

  updateStarterQuestion(index: number, value: string): void {
    this.form.starterQuestions[index] = value;
  }

  addStarterQuestion(): void {
    this.form.starterQuestions = [...this.form.starterQuestions, ""];
  }

  removeStarterQuestion(index: number): void {
    if (this.form.starterQuestions.length <= 1) {
      return;
    }
    this.form.starterQuestions = this.form.starterQuestions.filter((_, itemIndex) => itemIndex !== index);
  }

  applySuggestedStarters(): void {
    this.form.starterQuestions = this.starterSuggestions.length ? [...this.starterSuggestions] : [""];
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;
    this.pendingLogoFile = file;
    this.logoUpload.filename = file?.name ?? "";
    this.logoUpload.error = "";
  }

  async uploadLogo(): Promise<void> {
    const tenantId = this.store.activeTenantId();
    if (!tenantId || !this.pendingLogoFile) {
      return;
    }

    this.logoUpload.uploading = true;
    this.logoUpload.error = "";
    try {
      const uploaded = await this.api.uploadBotLogo(tenantId, this.pendingLogoFile);
      this.form.logoUrl = uploaded.url;
      this.pendingLogoFile = null;
      this.logoUpload.filename = "";
      if (this.logoUploadInput?.nativeElement) {
        this.logoUploadInput.nativeElement.value = "";
      }
      this.pushPreviewConfig(true);
    } catch (error: any) {
      this.logoUpload.error = error?.message ?? "Logo upload failed.";
    } finally {
      this.logoUpload.uploading = false;
    }
  }

  resolvedStarterQuestions(): string[] {
    return this.compactQuestions(this.form.starterQuestions).length
      ? this.compactQuestions(this.form.starterQuestions)
      : this.starterSuggestions;
  }

  resolvedAssistantProfile(): AssistantProfile {
    return {
      positioningStatement: this.form.assistantPositioning.trim() || this.resolvedBotCopy(),
      serviceCatalog: this.multilineList(this.form.assistantServicesText),
      qualificationGoals: this.multilineList(this.form.assistantQualificationGoalsText),
      nextStepRules: this.multilineList(this.form.assistantNextStepRulesText),
      servicePromptLibrary: this.resolvedStarterQuestions(),
    };
  }

  resolvedRuntimePolicy(): RuntimePolicy {
    return {
      posture: this.form.runtimePosture.trim() || "preventa consultiva",
      scope: this.form.runtimeScope.trim() || `${this.form.name || this.form.botName} + plantilla`,
      roadmapDepth: this.form.runtimeRoadmapDepth.trim() || "ahora + después",
      maxMobileSuggestions: Math.min(2, Math.max(1, Number(this.form.runtimeMobileSuggestions) || 2)),
      maxDesktopSuggestions: Math.min(3, Math.max(1, Number(this.form.runtimeDesktopSuggestions) || 3)),
      commercialIntentThreshold: Math.min(5, Math.max(1, Number(this.form.runtimeCommercialIntentThreshold) || 1)),
      hideStartersAfterFirstUserMessage: this.form.runtimeHideStartersAfterFirstUserMessage,
    };
  }

  resolvedBotCopy(): string {
    const value = this.form.botCopy.trim();
    if (value) {
      return value;
    }

    const positioning = this.form.assistantPositioning.trim();
    if (positioning) {
      return positioning;
    }

    const hint = this.siteProfile?.copyHints?.find((item) => item.trim());
    if (hint) {
      return hint;
    }

    if (this.form.language.startsWith("es")) {
      return `Consultas sobre ${this.form.botName || this.form.name}, servicios y contacto.`;
    }

    return `Questions about ${this.form.botName || this.form.name}, services and next steps.`;
  }

  resolvedWelcomeMessage(): string {
    const value = this.form.welcomeMessage.trim();
    if (value) {
      return value;
    }

    if (this.form.language.startsWith("es")) {
      return `Hola. Soy el asistente de ${this.form.botName || this.form.name}. ¿En qué puedo ayudarte?`;
    }

    return `Hello. I am the assistant for ${this.form.botName || this.form.name}. How can I help?`;
  }

  resolvedLauncherLabel(): string {
    const value = this.form.launcherLabel.trim();
    if (value) {
      return value;
    }

    if (this.form.language.startsWith("es")) {
      return `Hablar con ${this.form.botName || this.form.name || "el asistente"}`;
    }

    return `Talk to ${this.form.botName || this.form.name || "the assistant"}`;
  }

  resolvedLauncherIcon(): string {
    const value = this.form.launcherIcon.trim();
    if (value) {
      return value;
    }
    return this.launcherPreviewMark();
  }

  launcherPreviewMark(): string {
    return ((this.form.botName || this.form.name || "AI").trim()[0] || "A").toUpperCase();
  }

  launcherPreviewEyebrow(): string {
    const value = this.form.launcherEyebrow.trim() || this.form.botName.trim() || this.form.name.trim();
    return value || "AI Copilot";
  }

  resolvedComposerPlaceholder(): string {
    const value = this.form.composerPlaceholder.trim();
    if (value) {
      return value;
    }
    return this.form.language.startsWith("es")
      ? "Pregunta sobre el producto, integraciones o soporte."
      : "Ask about the product, integrations or support.";
  }

  resolvedSendButtonLabel(): string {
    const value = this.form.sendButtonLabel.trim();
    if (value) {
      return value;
    }
    return this.form.language.startsWith("es") ? "Enviar" : "Send";
  }

  pushPreviewConfig(force = false): void {
    if (!this.isBrowser) {
      return;
    }

    const payload = JSON.stringify(this.buildPreviewConfig());
    if (!force && payload === this.lastPreviewPayload) {
      return;
    }

    this.lastPreviewPayload = payload;
    this.postPreviewConfig(this.widgetPreviewFrame?.nativeElement, payload);
    this.postPreviewConfig(this.launcherPreviewFrame?.nativeElement, payload);
  }

  async save(): Promise<void> {
    const tenantId = this.store.activeTenantId();
    if (!tenantId || !this.botKey) {
      return;
    }

    this.saving = true;
    this.error = "";

    try {
      const updated = await this.api.updateTenantProject(tenantId, this.botKey, {
        name: this.form.name,
        status: this.form.status,
        language: this.form.language,
        languageMode: this.form.languageMode,
        botName: this.form.botName,
        allowedDomains: this.form.allowedDomainsText
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        publicBaseUrl: this.form.publicBaseUrl.trim() || null,
        welcomeMessage: this.form.welcomeMessage,
        promptPolicy: {
          tone: this.form.promptTone,
          outOfScopeMessage: this.form.outOfScopeMessage,
          guardrails: this.form.guardrailsText
            .split("\n")
            .map((value) => value.trim())
            .filter(Boolean),
          disallowPricing: this.form.disallowPricing,
        },
        ctaConfig: {
          primaryLabel: this.form.ctaPrimaryLabel,
          primaryUrl: this.form.ctaPrimaryUrl,
          secondaryLabel: this.form.ctaSecondaryLabel,
          secondaryUrl: this.form.ctaSecondaryUrl,
          salesKeywords: this.form.salesKeywordsText
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
        },
        widgetTheme: {
          presetKey: this.form.presetKey,
          launcherLabel: this.form.launcherLabel,
          launcherEyebrow: this.form.launcherEyebrow,
          launcherIcon: this.form.launcherIcon,
          launcherShape: this.form.launcherShape,
          buttonStyle: this.form.buttonStyle,
          accentColor: this.form.accentColor,
          surfaceColor: this.form.surfaceColor,
          textColor: this.form.textColor,
          botCopy: this.resolvedBotCopy(),
          logoUrl: this.form.logoUrl,
          removeBranding: this.form.removeBranding,
          proactiveMessage: this.form.proactiveMessage,
          proactiveDelaySeconds: Number(this.form.proactiveDelaySeconds),
          composerPlaceholder: this.form.composerPlaceholder,
          sendButtonLabel: this.form.sendButtonLabel,
        },
        enableHandover: this.form.enableHandover,
        aiConfig: {
          provider: this.form.aiProvider,
          model: this.form.aiModel,
          temperature: Number(this.form.aiTemperature),
          maxTokens: Number(this.form.aiMaxTokens),
          systemPromptAdditions: this.form.aiSystemPromptAdditions,
        },
        metadata: {
          assistantProfile: this.resolvedAssistantProfile(),
          runtimePolicy: this.resolvedRuntimePolicy(),
        },
        starterQuestions: this.resolvedStarterQuestions(),
      });

      this.applyProject(updated);
      await this.loadSnippet();
      this.saved = true;
      setTimeout(() => {
        this.saved = false;
      }, 2500);
    } catch (error: any) {
      this.error = error?.message ?? "Failed to save bot.";
    } finally {
      this.saving = false;
    }
  }

  async copyEmbed(): Promise<void> {
    if (!this.snippetText) {
      return;
    }

    await navigator.clipboard.writeText(this.snippetText);
    this.copiedEmbed = true;
    setTimeout(() => {
      this.copiedEmbed = false;
    }, 1800);
  }

  cancel(): void {
    void this.router.navigate(["/app/bots"]);
  }

  statusBadge(status?: string): string {
    switch (status) {
      case "active":
        return "ck-badge ck-badge--success";
      case "draft":
        return "ck-badge ck-badge--warning";
      case "disabled":
        return "ck-badge ck-badge--default";
      default:
        return "ck-badge ck-badge--default";
    }
  }

  roleBadge(role: string): string {
    switch (role) {
      case "user":
        return "ck-badge ck-badge--accent";
      case "assistant":
        return "ck-badge ck-badge--success";
      default:
        return "ck-badge ck-badge--default";
    }
  }

  channelBadge(channel?: string | null): string {
    switch (channel) {
      case "telegram":
        return "ck-badge ck-badge--info";
      case "whatsapp":
        return "ck-badge ck-badge--success";
      case "other":
        return "ck-badge ck-badge--warning";
      default:
        return "ck-badge ck-badge--default";
    }
  }

  async inspectConversation(conversationId: string): Promise<void> {
    const tenantId = this.store.activeTenantId();
    if (!tenantId || !conversationId) {
      return;
    }

    this.selectedConversationId = conversationId;
    this.loadingConversationDetail = true;
    try {
      this.selectedConversationMessages = await this.api.conversationMessages(tenantId, conversationId);
    } catch {
      this.selectedConversationMessages = [];
    } finally {
      this.loadingConversationDetail = false;
    }
  }

  private async load(tenantId: string, botKey: string): Promise<void> {
    this.loading = true;
    this.loadingHistory = true;
    this.error = "";
    try {
      const [project] = await Promise.all([
        this.api.tenantProject(tenantId, botKey),
        this.loadSnippet(tenantId, botKey),
        this.loadConversationHistory(tenantId, botKey),
      ]);
      this.applyProject(project);
    } catch (error: any) {
      this.error = error?.message ?? "Failed to load bot.";
    } finally {
      this.loading = false;
      this.loadingHistory = false;
    }
  }

  private async loadSnippet(tenantId = this.store.activeTenantId(), botKey = this.botKey): Promise<void> {
    if (!tenantId || !botKey) {
      return;
    }

    try {
      const snippet = await this.api.projectSnippet(tenantId, botKey);
      this.snippetText = snippet.snippet;
    } catch {
      this.snippetText = "";
    }
  }

  private async loadConversationHistory(tenantId: string, botKey: string): Promise<void> {
    try {
      const history = await this.api.tenantConversations(tenantId, botKey);
      this.conversationHistory = history
        .slice()
        .sort((left, right) => {
          const leftDate = new Date(left.lastMessageAt ?? left.createdAt).getTime();
          const rightDate = new Date(right.lastMessageAt ?? right.createdAt).getTime();
          return rightDate - leftDate;
        })
        .slice(0, 12);
      const firstConversationId = this.conversationHistory[0]?.id ?? "";
      if (firstConversationId) {
        await this.inspectConversation(firstConversationId);
      } else {
        this.selectedConversationId = "";
        this.selectedConversationMessages = [];
      }
    } catch {
      this.conversationHistory = [];
      this.selectedConversationId = "";
      this.selectedConversationMessages = [];
    }
  }

  private applyProject(project: ProjectDetail): void {
    this.siteProfile = this.readSiteProfile(project);
    this.starterSuggestions = this.deriveStarterSuggestions(project);
    const assistantProfile = this.readAssistantProfile(project);
    const runtimePolicy = this.readRuntimePolicy(project);
    this.form = {
      projectKey: project.projectKey,
      siteKey: project.siteKey,
      name: project.name,
      status: project.status ?? "active",
      language: project.language,
      languageMode: project.languageMode ?? "fixed",
      allowedDomainsText: project.allowedDomains.join(", "),
      publicBaseUrl: project.publicBaseUrl ?? "",
      botName: project.botName,
      welcomeMessage: project.welcomeMessage,
      botCopy: project.widgetTheme.botCopy ?? "",
      assistantPositioning: assistantProfile.positioningStatement,
      assistantServicesText: assistantProfile.serviceCatalog.join("\n"),
      assistantQualificationGoalsText: assistantProfile.qualificationGoals.join("\n"),
      assistantNextStepRulesText: assistantProfile.nextStepRules.join("\n"),
      promptTone: project.promptPolicy.tone,
      outOfScopeMessage: project.promptPolicy.outOfScopeMessage,
      guardrailsText: (project.promptPolicy.guardrails ?? []).join("\n"),
      disallowPricing: project.promptPolicy.disallowPricing ?? false,
      launcherLabel: project.widgetTheme.launcherLabel,
      launcherEyebrow: project.widgetTheme.launcherEyebrow ?? "",
      launcherIcon: project.widgetTheme.launcherIcon ?? "",
      launcherShape: project.widgetTheme.launcherShape ?? "pill",
      buttonStyle: project.widgetTheme.buttonStyle ?? "solid",
      accentColor: project.widgetTheme.accentColor,
      surfaceColor: project.widgetTheme.surfaceColor,
      textColor: project.widgetTheme.textColor,
      presetKey: project.widgetTheme.presetKey ?? this.resolveThemeKey(project.widgetTheme.accentColor),
      logoUrl: project.widgetTheme.logoUrl ?? "",
      removeBranding: project.widgetTheme.removeBranding ?? false,
      proactiveMessage: project.widgetTheme.proactiveMessage ?? "",
      proactiveDelaySeconds: project.widgetTheme.proactiveDelaySeconds ?? 8,
      composerPlaceholder: project.widgetTheme.composerPlaceholder ?? "",
      sendButtonLabel: project.widgetTheme.sendButtonLabel ?? "",
      ctaPrimaryLabel: project.ctaConfig.primaryLabel,
      ctaPrimaryUrl: project.ctaConfig.primaryUrl,
      ctaSecondaryLabel: project.ctaConfig.secondaryLabel ?? "",
      ctaSecondaryUrl: project.ctaConfig.secondaryUrl ?? "",
      salesKeywordsText: (project.ctaConfig.salesKeywords ?? []).join(", "),
      enableHandover: project.enableHandover ?? false,
      aiProvider: (project.aiConfig.provider ?? "deepseek") as NonNullable<AiConfig["provider"]>,
      aiModel: project.aiConfig.model ?? "",
      aiTemperature: project.aiConfig.temperature ?? 0.3,
      aiMaxTokens: project.aiConfig.maxTokens ?? 600,
      aiSystemPromptAdditions: project.aiConfig.systemPromptAdditions ?? "",
      runtimePosture: runtimePolicy.posture,
      runtimeScope: runtimePolicy.scope,
      runtimeRoadmapDepth: runtimePolicy.roadmapDepth,
      runtimeMobileSuggestions: runtimePolicy.maxMobileSuggestions,
      runtimeDesktopSuggestions: runtimePolicy.maxDesktopSuggestions,
      runtimeCommercialIntentThreshold: runtimePolicy.commercialIntentThreshold,
      runtimeHideStartersAfterFirstUserMessage: runtimePolicy.hideStartersAfterFirstUserMessage,
      starterQuestions: project.starterQuestions?.length ? [...project.starterQuestions] : [...this.starterSuggestions],
    };
    this.selectedThemeKey = this.form.presetKey;
    this.refreshPreviewUrls();
    this.lastPreviewPayload = "";
    queueMicrotask(() => this.pushPreviewConfig());
  }

  private resolveThemeKey(accentColor: string): WidgetPresetKey {
    const match = this.widgetThemes.find((theme) => theme.accentColor.toLowerCase() === accentColor.toLowerCase());
    return match?.key ?? "indigo";
  }

  private readSiteProfile(project: ProjectDetail): SiteProfile | null {
    const value = project.metadata?.["siteProfile"];
    if (!value || typeof value !== "object") {
      return null;
    }
    return value as SiteProfile;
  }

  private readAssistantProfile(project: ProjectDetail): AssistantProfile {
    const metadata = (project.metadata ?? {}) as Record<string, unknown>;
    const fallbackServices = this.deriveStarterSuggestions(project);
    const raw = (project.assistantProfile ?? metadata["assistantProfile"]) as Partial<AssistantProfile> | undefined;
    return {
      positioningStatement: raw?.positioningStatement?.trim() || project.widgetTheme.botCopy || `Asistente consultivo para ${project.botName || project.name}.`,
      serviceCatalog: this.stringList(raw?.serviceCatalog, fallbackServices.slice(0, 4)),
      qualificationGoals: this.stringList(raw?.qualificationGoals, [
        "Entender el reto y el contexto",
        "Detectar stack, restricciones y urgencia",
        "Orientar al siguiente paso correcto",
      ]),
      nextStepRules: this.stringList(raw?.nextStepRules, [
        "Ofrecer demo o reunión cuando haya intención comercial",
        "Pedir una única aclaración útil si falta contexto",
      ]),
      servicePromptLibrary: this.stringList(raw?.servicePromptLibrary, fallbackServices),
    };
  }

  private readRuntimePolicy(project: ProjectDetail): RuntimePolicy {
    const metadata = (project.metadata ?? {}) as Record<string, unknown>;
    const raw = (project.runtimePolicy ?? metadata["runtimePolicy"]) as Partial<RuntimePolicy> | undefined;
    return {
      posture: raw?.posture?.trim() || "preventa consultiva",
      scope: raw?.scope?.trim() || `${project.name || project.botName} + plantilla`,
      roadmapDepth: raw?.roadmapDepth?.trim() || "ahora + después",
      maxMobileSuggestions: this.numberWithin(raw?.maxMobileSuggestions, 1, 2, 2),
      maxDesktopSuggestions: this.numberWithin(raw?.maxDesktopSuggestions, 1, 3, 3),
      commercialIntentThreshold: this.numberWithin(raw?.commercialIntentThreshold, 1, 5, 1),
      hideStartersAfterFirstUserMessage: raw?.hideStartersAfterFirstUserMessage ?? true,
    };
  }

  private deriveStarterSuggestions(project: ProjectDetail): string[] {
    const stored = project.starterQuestions?.filter((item) => item.trim());
    if (stored?.length) {
      return stored;
    }

    const metadata = (project.metadata ?? {}) as Record<string, unknown>;
    const assistantProfile = (project.assistantProfile ?? metadata["assistantProfile"]) as Partial<AssistantProfile> | undefined;
    const profiledPrompts = assistantProfile?.servicePromptLibrary?.filter((item) => item.trim());
    if (profiledPrompts?.length) {
      return profiledPrompts;
    }
    const serviceCatalog = assistantProfile?.serviceCatalog?.filter((item) => item.trim());
    if (serviceCatalog?.length) {
      return serviceCatalog.slice(0, 6).map((service, index) => {
        if (project.language.startsWith("es")) {
          return index === 0
            ? `Quiero explorar ${service.toLowerCase()} para mi caso.`
            : `¿Cómo abordáis ${service.toLowerCase()} en un proyecto real?`;
        }
        return index === 0
          ? `I want to explore ${service.toLowerCase()} for my case.`
          : `How would you approach ${service.toLowerCase()} in a real project?`;
      });
    }

    const brand = project.botName || project.name || "el asistente";
    const copyHint = this.siteProfile?.copyHints?.[0];
    if (copyHint && project.language.startsWith("es")) {
      return [
        `¿Qué hace ${brand} exactamente?`,
        copyHint,
        `¿Cómo puede ayudarme ${brand} en mi caso?`,
        `Quiero hablar con el equipo de ${brand}`,
      ];
    }
    if (copyHint) {
      return [
        `What does ${brand} do exactly?`,
        copyHint,
        `How can ${brand} help in my case?`,
        `I want to speak with the ${brand} team`,
      ];
    }

    if (project.language.startsWith("es")) {
      return [
        `¿Qué hace ${brand} exactamente?`,
        `¿Qué servicios o soluciones ofrece ${brand}?`,
        `¿Cómo puede ayudarme ${brand} en mi caso?`,
        `Quiero hablar con el equipo de ${brand}`,
      ];
    }

    return [
      `What does ${brand} do exactly?`,
      `What services or solutions does ${brand} offer?`,
      `How can ${brand} help in my case?`,
      `I want to speak with the ${brand} team`,
    ];
  }

  private compactQuestions(values: string[]): string[] {
    return values.map((value) => value.trim()).filter(Boolean).slice(0, 12);
  }

  private multilineList(value: string): string[] {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private stringList(values: string[] | undefined, fallback: string[]): string[] {
    const cleaned = (values ?? []).map((item) => item.trim()).filter(Boolean);
    return cleaned.length ? cleaned : fallback;
  }

  private numberWithin(value: number | undefined, min: number, max: number, fallback: number): number {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return fallback;
    }
    return Math.min(max, Math.max(min, Math.round(value)));
  }

  private refreshPreviewUrls(): void {
    if (!this.isBrowser || !this.form.siteKey) {
      this.previewWidgetUrl = null;
      this.previewLauncherUrl = null;
      return;
    }

    const origin = this.document.location.origin;
    const base = `${origin}/widget/frame.html?siteKey=${encodeURIComponent(this.form.siteKey)}&apiBase=${encodeURIComponent(`${origin}/api`)}&origin=${encodeURIComponent(origin)}`;
    this.previewWidgetUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`${base}&previewMode=widget`);
    this.previewLauncherUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`${base}&previewMode=launcher`);
  }

  private buildPreviewConfig(): Record<string, unknown> {
    return {
      projectKey: this.form.projectKey,
      siteKey: this.form.siteKey,
      botName: this.form.botName || this.form.name,
      welcomeMessage: this.resolvedWelcomeMessage(),
      starterQuestions: this.resolvedStarterQuestions(),
      assistantProfile: this.resolvedAssistantProfile(),
      runtimePolicy: this.resolvedRuntimePolicy(),
      theme: {
        presetKey: this.form.presetKey,
        accentColor: this.form.accentColor,
        surfaceColor: this.form.surfaceColor,
        textColor: this.form.textColor,
        launcherLabel: this.resolvedLauncherLabel(),
        launcherEyebrow: this.launcherPreviewEyebrow(),
        launcherIcon: this.resolvedLauncherIcon(),
        launcherShape: this.form.launcherShape,
        buttonStyle: this.form.buttonStyle,
        botCopy: this.resolvedBotCopy(),
        logoUrl: this.form.logoUrl,
        removeBranding: this.form.removeBranding,
        proactiveMessage: this.form.proactiveMessage,
        proactiveDelaySeconds: Number(this.form.proactiveDelaySeconds),
        composerPlaceholder: this.resolvedComposerPlaceholder(),
        sendButtonLabel: this.resolvedSendButtonLabel(),
      },
      cta: {
        primaryLabel: this.form.ctaPrimaryLabel,
        primaryUrl: this.form.ctaPrimaryUrl,
        secondaryLabel: this.form.ctaSecondaryLabel,
        secondaryUrl: this.form.ctaSecondaryUrl,
      },
      promptPolicy: {
        tone: this.form.promptTone,
        outOfScopeMessage: this.form.outOfScopeMessage,
      },
      enableHandover: this.form.enableHandover,
    };
  }

  private postPreviewConfig(frame: HTMLIFrameElement | undefined, payload: string): void {
    if (!frame?.contentWindow) {
      return;
    }

    frame.contentWindow.postMessage(
      {
        type: "talkaris-chat:preview-config",
        config: JSON.parse(payload),
      },
      this.document.location.origin
    );
  }
}
