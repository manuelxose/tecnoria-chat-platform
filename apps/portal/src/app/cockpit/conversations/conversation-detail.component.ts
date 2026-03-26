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
        <a routerLink="/app/conversations" class="ck-auto-008">Conversations</a>
        <span>›</span>
        <strong>{{ conversationId.slice(0, 8) }}…</strong>
      </div>
    </div>

    <div class="ck-content">
      <div class="ck-page-header">
        <div>
          <h1 class="ck-page-header__title">Conversation</h1>
          <p class="ck-page-header__sub ck-auto-115">{{ conversationId }}</p>
        </div>
        <a class="ck-btn ck-btn--secondary ck-btn--sm" routerLink="/app/conversations">← Back</a>
      </div>

      @if (loading) {
        <div class="ck-card">
          @for (i of [1,2,3]; track i) {
            <div class="ck-skeleton ck-auto-116"></div>
          }
        </div>
      } @else if (messages.length > 0) {
        <div class="ck-grid-sidebar conversation-layout">
          <div class="ck-card ck-card--compact conversation-thread">
            @for (msg of messages; track msg.id) {
              <div [class]="msg.role === 'user' ? 'ck-chat-msg--user' : 'ck-chat-msg--bot'">
                <div [class]="msg.role === 'user' ? 'ck-chat-bubble--user chat-bubble' : 'ck-chat-bubble--bot chat-bubble'">
                  {{ msg.body }}
                </div>
                <div class="ck-chat-meta">
                  <span class="ck-badge" [class]="roleBadge(msg.role)">{{ msg.role }}</span>
                  <span class="ck-text-xs ck-text-muted">{{ msg.createdAt | date: 'HH:mm:ss' }}</span>
                  @if (msg.confidence !== null && msg.confidence !== undefined && msg.role === 'assistant') {
                    <span class="ck-text-xs ck-text-muted">Confidence {{ (msg.confidence * 100).toFixed(0) }}%</span>
                  }
                </div>
                @if (msg.citations && msg.citations.length > 0) {
                  <div class="ck-chat-citations">
                    @for (cite of msg.citations; track cite.url) {
                      <a
                        [href]="cite.url"
                        target="_blank"
                        rel="noopener"
                        class="ck-link-subtle"
                      >
                        {{ cite.title }}
                      </a>
                    }
                  </div>
                }
              </div>
            }
          </div>

          <div class="ck-stack-lg conversation-sidebar">
            <div class="ck-card ck-card--compact">
              <div class="ck-card__header">
                <p class="ck-card__title">Transcript Summary</p>
              </div>
              <div class="ck-kv-list">
                <div class="ck-kv-row">
                  <span class="ck-kv-row__key">Messages</span>
                  <span class="ck-kv-row__value">{{ messages.length }}</span>
                </div>
                <div class="ck-kv-row">
                  <span class="ck-kv-row__key">Started</span>
                  <span class="ck-kv-row__value">{{ messages[0].createdAt | date: 'MMM d, HH:mm' }}</span>
                </div>
                <div class="ck-kv-row">
                  <span class="ck-kv-row__key">Last activity</span>
                  <span class="ck-kv-row__value">{{ messages[messages.length - 1].createdAt | date: 'MMM d, HH:mm' }}</span>
                </div>
              </div>
            </div>

            <div class="ck-card ck-card--compact ck-auto-125">
              <div class="ck-card__header">
                <p class="ck-card__title">Satisfaction Rating</p>
              </div>
              @if (rating) {
                <div class="ck-auto-074">
                  <div
                    class="ck-auto-126"
                    [class.ck-score--success]="rating.score >= 4"
                    [class.ck-score--warning]="rating.score === 3"
                    [class.ck-score--danger]="rating.score <= 2"
                  >
                    {{ '★'.repeat(rating.score) }}{{ '☆'.repeat(5 - rating.score) }}
                  </div>
                  <div>
                    <p class="ck-auto-127">{{ rating.score }}/5</p>
                    @if (rating.comment) {
                      <p class="ck-auto-128">"{{ rating.comment }}"</p>
                    }
                  </div>
                </div>
              } @else {
                <p class="ck-auto-129">No rating submitted for this conversation.</p>
              }
            </div>

            @if (handover) {
              <div class="ck-card ck-card--compact ck-auto-125">
                <div class="ck-card__header">
                  <p class="ck-card__title">Human Handover</p>
                  <span class="ck-badge" [class]="handoverBadge(handover.status)">{{ handover.status }}</span>
                </div>
                @if (handover.reason) {
                  <p class="ck-auto-130">Reason: {{ handover.reason }}</p>
                }
                <div class="ck-auto-131">
                  <button class="ck-btn ck-btn--secondary ck-btn--sm" (click)="updateHandover('assigned')" [disabled]="handover.status === 'assigned'">Mark Assigned</button>
                  <button class="ck-btn ck-btn--ghost ck-btn--sm" (click)="updateHandover('closed')" [disabled]="handover.status === 'closed'">Close</button>
                </div>
              </div>
            }
          </div>
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

  roleBadge(role: string): string {
    switch (role) {
      case "user": return "ck-badge ck-badge--accent";
      case "assistant": return "ck-badge ck-badge--success";
      default: return "ck-badge ck-badge--default";
    }
  }

  handoverBadge(status: string): string {
    switch (status) {
      case "assigned": return "ck-badge ck-badge--info";
      case "closed": return "ck-badge ck-badge--default";
      default: return "ck-badge ck-badge--warning";
    }
  }
}
