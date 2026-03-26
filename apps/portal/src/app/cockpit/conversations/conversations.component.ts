import { Component, OnInit, effect } from "@angular/core";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { CockpitStore } from "../cockpit-store.service";
import { PortalApiService } from "../../core/portal-api.service";
import { ConversationItem } from "../../core/models";

@Component({
  selector: "app-conversations",
  standalone: true,
  imports: [RouterModule, FormsModule],
  template: `
    <div class="ck-topbar">
      <div class="ck-topbar__breadcrumb">
        <span>Conversations</span>
        <span>›</span>
        <strong>History</strong>
      </div>
    </div>

    <div class="ck-content">
      <div class="ck-page-header">
        <div>
          <h1 class="ck-page-header__title">Conversations</h1>
          <p class="ck-page-header__sub">Full conversation history across all bots</p>
        </div>
        <div class="ck-page-header__actions">
          <div class="ck-tabs">
            <button class="ck-tab is-active">History</button>
            <button class="ck-tab" disabled title="Real-time view coming soon">Live ·Soon</button>
          </div>
        </div>
      </div>

      <div class="ck-toolbar">
        <div class="ck-search-wrap">
          <span class="ck-search-icon">⌕</span>
          <input class="ck-input ck-search" type="text" placeholder="Filter by bot, contact or excerpt..." [(ngModel)]="searchQuery" />
        </div>
        <select class="ck-select ck-auto-132" [(ngModel)]="filterProject">
          <option value="">All bots</option>
          @for (key of projectKeys; track key) {
            <option [value]="key">{{ key }}</option>
          }
        </select>
      </div>

      @if (loading) {
        <div class="ck-card">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="ck-skeleton ck-auto-031"></div>
          }
        </div>
      } @else if (filtered.length > 0) {
        <div class="ck-table-wrap">
          <table class="ck-table">
            <thead>
              <tr>
                <th>Conversation ID</th>
                <th>Bot</th>
                <th>Channel</th>
                <th>Messages</th>
                <th>Preview</th>
                <th>Started</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (conv of filtered; track conv.id) {
                <tr class="ck-auto-133" (click)="open(conv)">
                  <td class="ck-table__cell--mono">{{ conv.id.slice(0, 8) }}…</td>
                  <td>
                    <div class="ck-stack-xs">
                      <span class="ck-badge ck-badge--accent">{{ conv.projectKey }}</span>
                      @if (conv.contactLabel) {
                        <span class="ck-text-xs ck-text-muted">{{ conv.contactLabel }}</span>
                      }
                    </div>
                  </td>
                  <td>
                    <span class="ck-badge" [class]="channelBadge(conv.channelKind)">
                      {{ conv.channelKind || "widget" }}
                    </span>
                  </td>
                  <td>{{ conv.messageCount }}</td>
                  <td class="ck-table__cell--wrap">
                    <div class="ck-stack-xs">
                      <span>{{ conv.lastMessagePreview || "No excerpt available yet." }}</span>
                      @if (conv.lastMessageAt) {
                        <span class="ck-text-xs ck-text-muted">{{ conv.lastMessageAt | date: 'MMM d, HH:mm' }}</span>
                      }
                    </div>
                  </td>
                  <td class="ck-auto-038">
                    {{ conv.createdAt | date: 'MMM d, HH:mm' }}
                  </td>
                  <td>
                    <button class="ck-btn ck-btn--ghost ck-btn--sm" (click)="open(conv); $event.stopPropagation()">
                      Inspect →
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <div class="ck-card">
          <div class="ck-empty">
            <div class="ck-empty__icon">◎</div>
            <p class="ck-empty__title">{{ searchQuery ? 'No conversations found' : 'No conversations yet' }}</p>
            <p class="ck-empty__sub">
              Conversations will appear here once users interact with your bots.
            </p>
          </div>
        </div>
      }
    </div>
  `,
})
export class ConversationsComponent implements OnInit {
  conversations: ConversationItem[] = [];
  loading = true;
  searchQuery = "";
  filterProject = "";

  get projectKeys(): string[] {
    return [...new Set(this.conversations.map((c) => c.projectKey))];
  }

  get filtered(): ConversationItem[] {
    return this.conversations.filter((c) => {
      const q = this.searchQuery.toLowerCase();
      const matchSearch = !q
        || c.projectKey.toLowerCase().includes(q)
        || (c.contactLabel ?? "").toLowerCase().includes(q)
        || (c.lastMessagePreview ?? "").toLowerCase().includes(q);
      const matchProject = !this.filterProject || c.projectKey === this.filterProject;
      return matchSearch && matchProject;
    });
  }

  constructor(
    private readonly store: CockpitStore,
    private readonly api: PortalApiService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {
    this.filterProject = this.route.snapshot.queryParamMap.get("projectKey") ?? "";
    effect(() => {
      const id = this.store.activeTenantId();
      if (id) this.load(id);
    });
  }

  async ngOnInit(): Promise<void> {
    const id = this.store.activeTenantId();
    if (id) await this.load(id);
  }

  private async load(tenantId: string): Promise<void> {
    this.loading = true;
    try {
      this.conversations = await this.api.tenantConversations(tenantId);
    } finally {
      this.loading = false;
    }
  }

  open(conv: ConversationItem): void {
    this.router.navigate(["/app/conversations", conv.id]);
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
}
