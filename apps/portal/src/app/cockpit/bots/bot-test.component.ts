import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { CockpitStore } from "../cockpit-store.service";
import { PortalApiService } from "../../core/portal-api.service";
import { TestChatResponse } from "../../core/models";

interface ChatEntry {
  role: "user" | "assistant";
  message: string;
  confidence?: number;
  citations?: Array<{ title: string; url: string; snippet: string }>;
}

@Component({
  selector: "app-bot-test",
  standalone: true,
  imports: [RouterModule, FormsModule],
  template: `
    <div class="ck-topbar">
      <div class="ck-topbar__breadcrumb">
        <span>Bots</span>
        <span>›</span>
        <a [routerLink]="['/app/bots', botKey]" style="color: var(--ck-text-soft); text-decoration: none;">{{ botKey }}</a>
        <span>›</span>
        <strong>Test Chat</strong>
      </div>
    </div>

    <div class="ck-content">
      <div class="ck-page-header">
        <div>
          <h1 class="ck-page-header__title">Bot Playground</h1>
          <p class="ck-page-header__sub">Test your bot's responses against its knowledge base</p>
        </div>
        <button class="ck-btn ck-btn--ghost ck-btn--sm" (click)="history = []">Clear</button>
      </div>

      <div style="max-width: 720px; display: flex; flex-direction: column; gap: 0;">

        <!-- Chat history -->
        <div style="min-height: 360px; max-height: 520px; overflow-y: auto; background: var(--ck-surface); border: 1px solid var(--ck-border); border-radius: var(--ck-radius) var(--ck-radius) 0 0; padding: 16px; display: flex; flex-direction: column; gap: 14px;" #chatBox>
          @if (!history.length) {
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--ck-text-muted); font-size: 0.84rem;">
              Send a message to start testing
            </div>
          }
          @for (entry of history; track $index) {
            @if (entry.role === 'user') {
              <div style="display: flex; justify-content: flex-end;">
                <div style="background: var(--ck-accent); color: #fff; padding: 10px 14px; border-radius: 16px 16px 4px 16px; max-width: 78%; font-size: 0.86rem; line-height: 1.5;">
                  {{ entry.message }}
                </div>
              </div>
            } @else {
              <div style="display: flex; flex-direction: column; gap: 8px; max-width: 88%;">
                <div style="background: var(--ck-surface-raised); border: 1px solid var(--ck-border); padding: 12px 14px; border-radius: 4px 16px 16px 16px; font-size: 0.86rem; line-height: 1.6; color: var(--ck-text);">
                  {{ entry.message }}
                </div>
                @if (entry.confidence !== undefined) {
                  <div style="display: flex; align-items: center; gap: 10px; padding-left: 4px;">
                    <span style="font-size: 0.76rem; color: var(--ck-text-muted);">
                      Confidence: <strong [style.color]="entry.confidence > 0.7 ? 'var(--ck-green)' : entry.confidence > 0.4 ? 'var(--ck-gold)' : 'var(--ck-red)'">{{ (entry.confidence * 100).toFixed(0) }}%</strong>
                    </span>
                    @if (entry.citations?.length) {
                      <span style="font-size: 0.76rem; color: var(--ck-text-muted);">{{ entry.citations!.length }} citation{{ entry.citations!.length !== 1 ? 's' : '' }}</span>
                    }
                  </div>
                }
                @if (entry.citations?.length) {
                  <div style="display: flex; flex-direction: column; gap: 4px; padding-left: 4px;">
                    @for (cit of entry.citations!; track cit.url) {
                      <a [href]="cit.url" target="_blank" rel="noopener" style="font-size: 0.76rem; color: var(--ck-accent-strong); text-decoration: none; display: flex; align-items: center; gap: 4px;">
                        <span>↗</span> {{ cit.title }}
                      </a>
                    }
                  </div>
                }
              </div>
            }
          }
          @if (loading) {
            <div style="display: flex; gap: 5px; padding-left: 4px;">
              <span class="ck-skeleton" style="width: 8px; height: 8px; border-radius: 50%; animation-delay: 0s;"></span>
              <span class="ck-skeleton" style="width: 8px; height: 8px; border-radius: 50%; animation-delay: 0.2s;"></span>
              <span class="ck-skeleton" style="width: 8px; height: 8px; border-radius: 50%; animation-delay: 0.4s;"></span>
            </div>
          }
        </div>

        <!-- Input -->
        <div style="display: flex; gap: 0; border: 1px solid var(--ck-border); border-top: none; border-radius: 0 0 var(--ck-radius) var(--ck-radius); background: var(--ck-surface-raised); overflow: hidden;">
          <input
            class="ck-input"
            style="border: none; border-radius: 0; background: transparent; flex: 1;"
            placeholder="Ask something…"
            [(ngModel)]="userInput"
            (keydown.enter)="send()"
            [disabled]="loading"
          />
          <button
            class="ck-btn ck-btn--primary"
            style="border-radius: 0; min-width: 80px;"
            (click)="send()"
            [disabled]="loading || !userInput.trim()"
          >
            {{ loading ? '…' : 'Send' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class BotTestComponent implements OnInit {
  botKey = "";
  history: ChatEntry[] = [];
  userInput = "";
  loading = false;

  constructor(
    private readonly route: ActivatedRoute,
    readonly store: CockpitStore,
    private readonly api: PortalApiService
  ) {}

  ngOnInit(): void {
    this.botKey = this.route.snapshot.paramMap.get("botKey") ?? "";
  }

  async send(): Promise<void> {
    const msg = this.userInput.trim();
    const tenantId = this.store.activeTenantId();
    if (!msg || !tenantId || this.loading) return;
    this.userInput = "";
    this.history.push({ role: "user", message: msg });
    this.loading = true;
    try {
      const resp: TestChatResponse = await this.api.testChat(tenantId, this.botKey, msg);
      this.history.push({
        role: "assistant",
        message: resp.message,
        confidence: resp.confidence,
        citations: resp.citations,
      });
    } catch {
      this.history.push({ role: "assistant", message: "Error: could not reach the API. Check the console." });
    } finally {
      this.loading = false;
    }
  }
}
