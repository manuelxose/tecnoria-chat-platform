import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { CockpitStore } from "../cockpit-store.service";
import { PortalApiService } from "../../core/portal-api.service";
import { HandoverEvent, MessageItem } from "../../core/models";

@Component({
  selector: "app-conversation-detail",
  standalone: true,
  imports: [RouterModule, FormsModule],
  template: `
    <div class="ck-topbar">
      <div class="ck-topbar__breadcrumb">
        <a routerLink="/app/conversations" style="color: var(--ck-text-muted); text-decoration: none;">Conversations</a>
        <span>›</span>
        <strong>{{ conversationId.slice(0, 8) }}…</strong>
      </div>
    </div>

    <div class="ck-content">
      <div class="ck-page-header">
        <div>
          <h1 class="ck-page-header__title">Conversation</h1>
          <p class="ck-page-header__sub" style="font-family: ui-monospace; font-size: 0.8rem;">{{ conversationId }}</p>
        </div>
        <a class="ck-btn ck-btn--secondary ck-btn--sm" routerLink="/app/conversations">← Back</a>
      </div>

      @if (loading) {
        <div class="ck-card">
          @for (i of [1,2,3]; track i) {
            <div class="ck-skeleton" style="height: 80px; margin-bottom: 12px;"></div>
          }
        </div>
      } @else if (messages.length > 0) {
        <div style="display: grid; gap: 10px; max-width: 720px;">
          @for (msg of messages; track msg.id) {
            <div class="ck-card ck-card--compact" [style]="msgStyle(msg.role)">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="ck-badge" [class]="roleBadge(msg.role)">{{ msg.role }}</span>
                  @if (msg.confidence !== null && msg.confidence !== undefined && msg.role === 'assistant') {
                    <span style="font-size: 0.72rem; color: var(--ck-text-muted);">
                      Confidence: {{ (msg.confidence * 100).toFixed(0) }}%
                    </span>
                  }
                </div>
                <span style="font-size: 0.72rem; color: var(--ck-text-muted);">
                  {{ msg.createdAt | date: 'HH:mm:ss' }}
                </span>
              </div>
              <p style="margin: 0; font-size: 0.88rem; white-space: pre-wrap; line-height: 1.6; color: var(--ck-text);">{{ msg.body }}</p>
              @if (msg.citations && msg.citations.length > 0) {
                <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--ck-border);">
                  <p style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--ck-text-muted); margin: 0 0 6px;">
                    Citations
                  </p>
                  <div style="display: grid; gap: 4px;">
                    @for (cite of msg.citations; track cite.url) {
                      <a
                        [href]="cite.url"
                        target="_blank"
                        rel="noopener"
                        style="font-size: 0.8rem; color: var(--ck-accent-strong); text-decoration: none;"
                      >
                        {{ cite.title }}
                      </a>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      } @else {
        <div class="ck-card">
          <div class="ck-empty">
            <div class="ck-empty__icon">◎</div>
            <p class="ck-empty__title">No messages found</p>
            <p class="ck-empty__sub">This conversation appears to be empty.</p>
          </div>
        </div>
      }

      <!-- CSAT Rating -->
      @if (!loading) {
        <div class="ck-card" style="max-width: 720px; margin-top: 16px;">
          <div class="ck-card__header">
            <p class="ck-card__title">Satisfaction Rating</p>
          </div>
          @if (rating) {
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="font-size: 2rem; line-height: 1;" [style.color]="ratingColor(rating.score)">
                {{ '★'.repeat(rating.score) }}{{ '☆'.repeat(5 - rating.score) }}
              </div>
              <div>
                <p style="font-size: 0.9rem; font-weight: 600; color: var(--ck-text);">{{ rating.score }}/5</p>
                @if (rating.comment) {
                  <p style="font-size: 0.82rem; color: var(--ck-text-soft); margin: 2px 0 0;">"{{ rating.comment }}"</p>
                }
              </div>
            </div>
          } @else {
            <p style="font-size: 0.84rem; color: var(--ck-text-muted);">No rating submitted for this conversation.</p>
          }
        </div>
      }

      <!-- Handover Status -->
      @if (!loading && handover) {
        <div class="ck-card" style="max-width: 720px; margin-top: 16px;">
          <div class="ck-card__header">
            <p class="ck-card__title">Human Handover</p>
            <span class="ck-badge" [class]="handoverBadge(handover.status)">{{ handover.status }}</span>
          </div>
          @if (handover.reason) {
            <p style="font-size: 0.84rem; color: var(--ck-text-soft); margin-bottom: 12px;">Reason: {{ handover.reason }}</p>
          }
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="ck-btn ck-btn--secondary ck-btn--sm" (click)="updateHandover('assigned')" [disabled]="handover.status === 'assigned'">Mark Assigned</button>
            <button class="ck-btn ck-btn--ghost ck-btn--sm" (click)="updateHandover('closed')" [disabled]="handover.status === 'closed'">Close</button>
          </div>
        </div>
      }
    </div>
  `,
})
export class ConversationDetailComponent implements OnInit {
  conversationId = "";
  messages: MessageItem[] = [];
  loading = true;
  rating: { score: number; comment: string | null } | null = null;
  handover: HandoverEvent | null = null;

  constructor(
    private readonly store: CockpitStore,
    private readonly api: PortalApiService,
    private readonly route: ActivatedRoute
  ) {}

  async ngOnInit(): Promise<void> {
    this.conversationId = this.route.snapshot.paramMap.get("id") ?? "";
    const tenantId = this.store.activeTenantId();
    if (!tenantId || !this.conversationId) return;
    try {
      [this.messages] = await Promise.all([
        this.api.conversationMessages(tenantId, this.conversationId),
      ]);
      // Load rating and handover non-blocking
      this.api.getHandover(tenantId, this.conversationId).then((h) => this.handover = h).catch(() => {});
      this.loadRating(tenantId);
    } finally {
      this.loading = false;
    }
  }

  private async loadRating(tenantId: string): Promise<void> {
    try {
      const r = await this.api.conversationRating(tenantId, this.conversationId);
      if (r) this.rating = r;
    } catch { /* no rating */ }
  }

  async updateHandover(status: "pending" | "assigned" | "closed"): Promise<void> {
    const tenantId = this.store.activeTenantId();
    if (!tenantId || !this.handover) return;
    this.handover = await this.api.updateHandover(tenantId, this.conversationId, status);
  }

  msgStyle(role: string): string {
    if (role === "user") return "border-left: 3px solid var(--ck-accent);";
    if (role === "assistant") return "border-left: 3px solid var(--ck-success);";
    return "border-left: 3px solid var(--ck-border-strong);";
  }

  roleBadge(role: string): string {
    switch (role) {
      case "user": return "ck-badge ck-badge--accent";
      case "assistant": return "ck-badge ck-badge--success";
      default: return "ck-badge ck-badge--default";
    }
  }

  ratingColor(score: number): string {
    if (score >= 4) return "var(--ck-green, #3fb950)";
    if (score >= 3) return "var(--ck-gold, #c29a52)";
    return "var(--ck-red, #f85149)";
  }

  handoverBadge(status: string): string {
    switch (status) {
      case "assigned": return "ck-badge ck-badge--info";
      case "closed": return "ck-badge ck-badge--default";
      default: return "ck-badge ck-badge--warning";
    }
  }
}
