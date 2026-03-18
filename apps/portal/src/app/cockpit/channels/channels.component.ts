import { Component, OnInit, effect } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { CockpitStore } from "../cockpit-store.service";
import { PortalApiService } from "../../core/portal-api.service";
import { ChannelItem, Project } from "../../core/models";

@Component({
  selector: "app-channels",
  standalone: true,
  imports: [RouterModule, FormsModule],
  template: `
    <div class="ck-topbar">
      <div class="ck-topbar__breadcrumb">
        <strong>Channels</strong>
      </div>
    </div>

    <div class="ck-content">
      <div class="ck-page-header">
        <div>
          <h1 class="ck-page-header__title">Channels</h1>
          <p class="ck-page-header__sub">Connect your bots to Telegram and other messaging platforms</p>
        </div>
        <div class="ck-page-header__actions">
          <select class="ck-select" style="min-width: 200px;" [(ngModel)]="selectedProjectKey" (ngModelChange)="onProjectChange($event)">
            @for (p of projects; track p.projectKey) {
              <option [value]="p.projectKey">{{ p.botName }} · {{ p.projectKey }}</option>
            }
          </select>
          <button class="ck-btn ck-btn--primary" (click)="openAddModal()" [disabled]="!selectedProjectKey">
            + Add Telegram Bot
          </button>
        </div>
      </div>

      @if (!selectedProjectKey) {
        <div class="ck-card">
          <div class="ck-empty">
            <div class="ck-empty__icon">◫</div>
            <p class="ck-empty__title">Select a bot to manage channels</p>
          </div>
        </div>
      } @else if (loading) {
        <div class="ck-card">
          <div class="ck-skeleton" style="height: 80px;"></div>
        </div>
      } @else if (channels.length === 0) {
        <div class="ck-card">
          <div class="ck-empty">
            <div class="ck-empty__icon">◫</div>
            <p class="ck-empty__title">No channels yet</p>
            <p class="ck-empty__sub">Add a Telegram bot to start receiving messages from Telegram.</p>
            <button class="ck-btn ck-btn--primary" style="margin-top: 16px;" (click)="openAddModal()">
              + Add Telegram Bot
            </button>
          </div>
        </div>
      } @else {
        <div class="ck-card">
          <div class="ck-table-wrap">
            <table class="ck-table">
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Status</th>
                  <th>Bot Token</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (ch of channels; track ch.id) {
                  <tr>
                    <td>
                      <span class="ck-badge ck-badge--default" style="text-transform: uppercase; letter-spacing: 0.5px;">
                        {{ ch.kind }}
                      </span>
                    </td>
                    <td>
                      <span class="ck-badge" [class]="ch.status === 'active' ? 'ck-badge--success' : 'ck-badge--warning'">
                        <span class="ck-dot"></span>
                        {{ ch.status }}
                      </span>
                    </td>
                    <td style="font-size: 0.82rem; color: var(--ck-text-muted);">
                      {{ ch.has_token ? '••••••••' : '—' }}
                    </td>
                    <td style="font-size: 0.82rem; color: var(--ck-text-muted);">
                      {{ ch.created_at | slice:0:10 }}
                    </td>
                    <td>
                      <button class="ck-btn ck-btn--ghost ck-btn--sm"
                              style="color: var(--ck-red);"
                              (click)="confirmDelete(ch)"
                              [disabled]="deleting === ch.id">
                        {{ deleting === ch.id ? '…' : 'Remove' }}
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- How it works info box -->
        <div class="ck-card" style="margin-top: 16px;">
          <div class="ck-card__header">
            <p class="ck-card__title">How it works</p>
          </div>
          <ol style="padding-left: 20px; font-size: 0.84rem; color: var(--ck-text-soft); line-height: 2;">
            <li>Create a Telegram bot via <strong>&#64;BotFather</strong> and get your bot token.</li>
            <li>Paste the token above — the webhook is registered automatically.</li>
            <li>Users message your Telegram bot and receive RAG-powered replies instantly.</li>
          </ol>
        </div>
      }
    </div>

    <!-- Add Telegram modal -->
    @if (showAddModal) {
      <div style="position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;"
           (click)="showAddModal = false">
        <div class="ck-card" style="width: 440px; background: var(--ck-surface-raised);" (click)="$event.stopPropagation()">
          <div class="ck-card__header">
            <div>
              <p class="ck-card__title">Add Telegram Bot</p>
              <p class="ck-card__sub">Connect your Telegram bot to this project</p>
            </div>
            <button class="ck-btn ck-btn--ghost ck-btn--sm" (click)="showAddModal = false">✕</button>
          </div>

          <div style="display: grid; gap: 16px; margin-top: 8px;">
            <div class="ck-field">
              <label class="ck-label">Bot Token</label>
              <input class="ck-input" [(ngModel)]="newBotToken"
                     placeholder="1234567890:ABCdefGHIjklMNOpqrSTUvwxyz"
                     [disabled]="adding" />
              <span style="font-size: 0.75rem; color: var(--ck-text-muted);">
                Get this from <strong>&#64;BotFather</strong> on Telegram → /newbot
              </span>
            </div>

            @if (addError) {
              <div style="background: var(--ck-red-soft, rgba(248,81,73,0.12)); color: var(--ck-red, #f85149); padding: 10px 12px; border-radius: var(--ck-radius-sm); font-size: 0.83rem;">
                {{ addError }}
              </div>
            }

            @if (webhookUrl) {
              <div style="background: var(--ck-accent-soft); border-radius: var(--ck-radius-sm); padding: 10px 12px;">
                <p style="font-size: 0.78rem; color: var(--ck-accent-strong); margin: 0 0 4px;">Webhook registered at:</p>
                <code style="font-size: 0.75rem; word-break: break-all;">{{ webhookUrl }}</code>
              </div>
            }

            <div style="display: flex; gap: 10px; justify-content: flex-end;">
              <button class="ck-btn ck-btn--ghost" (click)="showAddModal = false" [disabled]="adding">Cancel</button>
              <button class="ck-btn ck-btn--primary" (click)="addChannel()" [disabled]="adding || !newBotToken">
                {{ adding ? 'Connecting…' : 'Connect Bot' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class ChannelsComponent implements OnInit {
  projects: Project[] = [];
  selectedProjectKey = "";
  channels: ChannelItem[] = [];
  loading = false;
  deleting = "";
  showAddModal = false;
  newBotToken = "";
  adding = false;
  addError = "";
  webhookUrl = "";

  constructor(
    private readonly store: CockpitStore,
    private readonly api: PortalApiService
  ) {
    effect(() => {
      const id = this.store.activeTenantId();
      if (id) this.loadProjects(id);
    });
  }

  async ngOnInit(): Promise<void> {
    const id = this.store.activeTenantId();
    if (id) await this.loadProjects(id);
  }

  private async loadProjects(tenantId: string): Promise<void> {
    this.projects = await this.api.tenantProjects(tenantId);
    if (this.projects.length) {
      this.selectedProjectKey = this.projects[0].projectKey;
      await this.loadChannels();
    }
  }

  onProjectChange(_key: string): void {
    this.channels = [];
    this.loadChannels();
  }

  private async loadChannels(): Promise<void> {
    const tenantId = this.store.activeTenantId();
    if (!tenantId || !this.selectedProjectKey) return;
    this.loading = true;
    try {
      this.channels = await this.api.listChannels(tenantId, this.selectedProjectKey);
    } catch {
      this.channels = [];
    } finally {
      this.loading = false;
    }
  }

  openAddModal(): void {
    this.newBotToken = "";
    this.addError = "";
    this.webhookUrl = "";
    this.showAddModal = true;
  }

  async addChannel(): Promise<void> {
    const tenantId = this.store.activeTenantId();
    if (!tenantId || !this.selectedProjectKey || !this.newBotToken.trim()) return;
    this.adding = true;
    this.addError = "";
    try {
      const result = await this.api.createTelegramChannel(tenantId, this.selectedProjectKey, this.newBotToken.trim());
      this.webhookUrl = result.webhookUrl;
      await this.loadChannels();
      setTimeout(() => { this.showAddModal = false; }, 2000);
    } catch (err: unknown) {
      this.addError = (err as { message?: string }).message ?? "Failed to connect bot. Check the token and try again.";
    } finally {
      this.adding = false;
    }
  }

  async confirmDelete(ch: ChannelItem): Promise<void> {
    if (!confirm(`Remove this ${ch.kind} channel? Messages will no longer be received.`)) return;
    const tenantId = this.store.activeTenantId();
    if (!tenantId) return;
    this.deleting = ch.id;
    try {
      await this.api.deleteChannel(tenantId, this.selectedProjectKey, ch.id);
      this.channels = this.channels.filter(c => c.id !== ch.id);
    } finally {
      this.deleting = "";
    }
  }
}
