import { Component, OnInit, effect } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { CockpitStore } from "../cockpit-store.service";
import { PortalApiService } from "../../core/portal-api.service";
import { ChannelItem, Project } from "../../core/models";

type ChannelKind = "telegram" | "whatsapp";

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
          <p class="ck-page-header__sub">Operate Telegram and WhatsApp from the same bot runtime.</p>
        </div>
        <div class="ck-page-header__actions">
          <select class="ck-select ck-select--project" [(ngModel)]="selectedProjectKey" (ngModelChange)="onProjectChange()">
            @for (p of projects; track p.projectKey) {
              <option [value]="p.projectKey">{{ p.botName }} · {{ p.projectKey }}</option>
            }
          </select>
          <button class="ck-btn ck-btn--primary" (click)="openAddModal('telegram')" [disabled]="!selectedProjectKey">
            + Add Channel
          </button>
        </div>
      </div>

      @if (!selectedProjectKey) {
        <div class="ck-card">
          <div class="ck-empty">
            <div class="ck-empty__icon">◫</div>
            <p class="ck-empty__title">Select a bot to manage channels</p>
            <p class="ck-empty__sub">Channels are isolated per bot and share the same governed runtime.</p>
          </div>
        </div>
      } @else if (loading) {
        <div class="ck-card">
          <div class="ck-skeleton ck-skeleton--2xl ck-skeleton--mb-md"></div>
          <div class="ck-skeleton ck-skeleton--xl ck-skeleton--mb-md"></div>
          <div class="ck-skeleton ck-skeleton--xl"></div>
        </div>
      } @else {
        <div class="ck-grid-sidebar">
          <div class="ck-stack-lg">
            @if (channels.length === 0) {
              <div class="ck-card">
                <div class="ck-empty">
                  <div class="ck-empty__icon">⇄</div>
                  <p class="ck-empty__title">No channels configured</p>
                  <p class="ck-empty__sub">Add Telegram or WhatsApp to route real conversations into this bot.</p>
                  <div class="ck-flow-inline">
                    <button class="ck-btn ck-btn--primary" (click)="openAddModal('telegram')">Telegram</button>
                    <button class="ck-btn ck-btn--secondary" (click)="openAddModal('whatsapp')">WhatsApp</button>
                  </div>
                </div>
              </div>
            } @else {
              @for (channel of channels; track channel.id) {
                <div class="ck-card ck-stack-md">
                  <div class="ck-row-between-start">
                    <div class="ck-stack-xs">
                      <div class="ck-flow-inline">
                        <span class="ck-badge ck-badge--default">{{ channel.kind }}</span>
                        <span class="ck-badge" [class]="channel.status === 'active' ? 'ck-badge ck-badge--success' : 'ck-badge ck-badge--warning'">
                          {{ channel.status }}
                        </span>
                        <span class="ck-badge" [class]="channel.verified ? 'ck-badge ck-badge--info' : 'ck-badge ck-badge--default'">
                          {{ channel.verified ? 'verified' : 'pending verification' }}
                        </span>
                      </div>
                      <p class="ck-card__title">{{ channel.label || selectedProjectKey }}</p>
                      <p class="ck-card__sub">{{ channelSummary(channel) }}</p>
                    </div>
                    <button
                      class="ck-btn ck-btn--ghost ck-btn--sm"
                      (click)="confirmDelete(channel)"
                      [disabled]="deleting === channel.id"
                    >
                      {{ deleting === channel.id ? "Removing…" : "Remove" }}
                    </button>
                  </div>

                  <div class="ck-note">
                    <div class="ck-stack-xs">
                      <span class="ck-text-xs ck-text-muted">Webhook</span>
                      <code class="ck-font-mono ck-text-sm ck-text-soft">{{ channel.webhookUrl || "Not available" }}</code>
                    </div>
                  </div>

                  @if (channel.phoneNumber) {
                    <div class="ck-row-between">
                      <span class="ck-text-sm ck-text-muted">Phone</span>
                      <strong class="ck-text-sm">{{ channel.phoneNumber }}</strong>
                    </div>
                  }

                  @if (channel.lastError) {
                    <div class="ck-alert ck-alert--danger">{{ channel.lastError }}</div>
                  }
                </div>
              }
            }
          </div>

          <div class="ck-card ck-stack-lg">
            <div class="ck-card__header">
              <div>
                <p class="ck-card__title">Channel Design</p>
                <p class="ck-card__sub">The same runtime, history and governance across widget, Telegram and WhatsApp.</p>
              </div>
            </div>
            <div class="ck-stack-sm">
              <div class="ck-note">
                <strong class="ck-text-sm">Telegram</strong>
                <p class="ck-text-sm ck-text-soft ck-mt-sm">Paste your BotFather token and Talkaris registers the webhook automatically.</p>
              </div>
              <div class="ck-note">
                <strong class="ck-text-sm">WhatsApp Meta Cloud</strong>
                <p class="ck-text-sm ck-text-soft ck-mt-sm">Use the webhook URL and verify token from Talkaris in the Meta app configuration, then incoming messages will flow into the same bot runtime.</p>
              </div>
            </div>
          </div>
        </div>
      }
    </div>

    @if (showAddModal) {
      <div class="ck-modal-backdrop" (click)="closeModal()">
        <div class="ck-card ck-modal ck-stack-lg" (click)="$event.stopPropagation()">
          <div class="ck-card__header">
            <div>
              <p class="ck-card__title">Add Channel</p>
              <p class="ck-card__sub">Connect {{ selectedProjectKey }} to Telegram or WhatsApp.</p>
            </div>
            <button class="ck-btn ck-btn--ghost ck-btn--sm" (click)="closeModal()">✕</button>
          </div>

          <div class="ck-tabs">
            <button class="ck-tab" [class.is-active]="channelKind === 'telegram'" (click)="channelKind = 'telegram'">Telegram</button>
            <button class="ck-tab" [class.is-active]="channelKind === 'whatsapp'" (click)="channelKind = 'whatsapp'">WhatsApp</button>
          </div>

          @if (channelKind === 'telegram') {
            <div class="ck-form-stack">
              <div class="ck-field">
                <label class="ck-label">Display Label</label>
                <input class="ck-input" [(ngModel)]="telegramForm.label" placeholder="Support bot" />
              </div>
              <div class="ck-field">
                <label class="ck-label">Bot Token</label>
                <input class="ck-input" [(ngModel)]="telegramForm.botToken" placeholder="1234567890:ABC..." />
                <span class="ck-text-xs ck-text-muted">Issued by BotFather. The webhook is registered automatically.</span>
              </div>
            </div>
          } @else {
            <div class="ck-form-stack">
              <div class="ck-field">
                <label class="ck-label">Display Label</label>
                <input class="ck-input" [(ngModel)]="whatsappForm.label" placeholder="Sales WhatsApp" />
              </div>
              <div class="ck-form-grid">
                <div class="ck-field">
                  <label class="ck-label">Access Token</label>
                  <input class="ck-input" [(ngModel)]="whatsappForm.accessToken" type="password" placeholder="EAA..." />
                </div>
                <div class="ck-field">
                  <label class="ck-label">Phone Number ID</label>
                  <input class="ck-input" [(ngModel)]="whatsappForm.phoneNumberId" placeholder="123456789012345" />
                </div>
              </div>
              <div class="ck-form-grid">
                <div class="ck-field">
                  <label class="ck-label">Business Account ID</label>
                  <input class="ck-input" [(ngModel)]="whatsappForm.businessAccountId" placeholder="Optional" />
                </div>
                <div class="ck-field">
                  <label class="ck-label">Display Phone</label>
                  <input class="ck-input" [(ngModel)]="whatsappForm.displayPhoneNumber" placeholder="+34 600 000 000" />
                </div>
              </div>
              <div class="ck-form-grid">
                <div class="ck-field">
                  <label class="ck-label">Verify Token</label>
                  <input class="ck-input" [(ngModel)]="whatsappForm.verifyToken" placeholder="talkaris-meta-verify-token" />
                </div>
                <div class="ck-field">
                  <label class="ck-label">App Secret</label>
                  <input class="ck-input" [(ngModel)]="whatsappForm.appSecret" type="password" placeholder="Optional" />
                </div>
              </div>
              <p class="ck-text-xs ck-text-muted">After saving, use the generated webhook URL and verify token in Meta Cloud API.</p>
            </div>
          }

          @if (addError) {
            <div class="ck-alert ck-alert--danger">{{ addError }}</div>
          }

          @if (createdWebhookUrl) {
            <div class="ck-note ck-note--accent">
              <div class="ck-stack-xs">
                <span class="ck-text-xs ck-text-muted">Webhook ready</span>
                <code class="ck-font-mono ck-text-sm">{{ createdWebhookUrl }}</code>
              </div>
            </div>
          }

          <div class="ck-row-between">
            <button class="ck-btn ck-btn--ghost" (click)="closeModal()" [disabled]="adding">Cancel</button>
            <button class="ck-btn ck-btn--primary" (click)="addChannel()" [disabled]="adding || !isChannelFormValid()">
              {{ adding ? "Connecting…" : "Connect Channel" }}
            </button>
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
  adding = false;
  addError = "";
  createdWebhookUrl = "";
  channelKind: ChannelKind = "telegram";

  telegramForm = {
    label: "",
    botToken: "",
  };

  whatsappForm = {
    label: "",
    accessToken: "",
    phoneNumberId: "",
    businessAccountId: "",
    verifyToken: "",
    appSecret: "",
    displayPhoneNumber: "",
  };

  constructor(
    private readonly store: CockpitStore,
    private readonly api: PortalApiService
  ) {
    effect(() => {
      const id = this.store.activeTenantId();
      if (id) {
        void this.loadProjects(id);
      }
    });
  }

  async ngOnInit(): Promise<void> {
    const tenantId = this.store.activeTenantId();
    if (tenantId) {
      await this.loadProjects(tenantId);
    }
  }

  async loadProjects(tenantId: string): Promise<void> {
    this.projects = await this.api.tenantProjects(tenantId);
    if (!this.projects.length) {
      this.selectedProjectKey = "";
      this.channels = [];
      return;
    }
    if (!this.selectedProjectKey || !this.projects.some((project) => project.projectKey === this.selectedProjectKey)) {
      this.selectedProjectKey = this.projects[0].projectKey;
    }
    await this.loadChannels();
  }

  async onProjectChange(): Promise<void> {
    this.channels = [];
    await this.loadChannels();
  }

  async loadChannels(): Promise<void> {
    const tenantId = this.store.activeTenantId();
    if (!tenantId || !this.selectedProjectKey) {
      return;
    }
    this.loading = true;
    try {
      this.channels = await this.api.listChannels(tenantId, this.selectedProjectKey);
    } catch {
      this.channels = [];
    } finally {
      this.loading = false;
    }
  }

  openAddModal(kind: ChannelKind): void {
    this.channelKind = kind;
    this.showAddModal = true;
    this.adding = false;
    this.addError = "";
    this.createdWebhookUrl = "";
    this.telegramForm = { label: "", botToken: "" };
    this.whatsappForm = {
      label: "",
      accessToken: "",
      phoneNumberId: "",
      businessAccountId: "",
      verifyToken: "",
      appSecret: "",
      displayPhoneNumber: "",
    };
  }

  closeModal(): void {
    this.showAddModal = false;
  }

  isChannelFormValid(): boolean {
    if (this.channelKind === "telegram") {
      return this.telegramForm.botToken.trim().length > 10;
    }
    return (
      this.whatsappForm.accessToken.trim().length > 10
      && this.whatsappForm.phoneNumberId.trim().length > 3
      && this.whatsappForm.verifyToken.trim().length > 7
    );
  }

  async addChannel(): Promise<void> {
    const tenantId = this.store.activeTenantId();
    if (!tenantId || !this.selectedProjectKey || !this.isChannelFormValid()) {
      return;
    }

    this.adding = true;
    this.addError = "";
    this.createdWebhookUrl = "";
    try {
      const channel = await this.api.createChannel(
        tenantId,
        this.selectedProjectKey,
        this.channelKind === "telegram"
          ? {
              kind: "telegram",
              label: this.telegramForm.label.trim() || undefined,
              botToken: this.telegramForm.botToken.trim(),
            }
          : {
              kind: "whatsapp",
              label: this.whatsappForm.label.trim() || undefined,
              accessToken: this.whatsappForm.accessToken.trim(),
              phoneNumberId: this.whatsappForm.phoneNumberId.trim(),
              businessAccountId: this.whatsappForm.businessAccountId.trim() || undefined,
              verifyToken: this.whatsappForm.verifyToken.trim(),
              appSecret: this.whatsappForm.appSecret.trim() || undefined,
              displayPhoneNumber: this.whatsappForm.displayPhoneNumber.trim() || undefined,
            }
      );
      this.createdWebhookUrl = channel.webhookUrl ?? "";
      await this.loadChannels();
      setTimeout(() => {
        this.closeModal();
      }, 1200);
    } catch (error: unknown) {
      this.addError = (error as { message?: string }).message ?? "Failed to connect channel.";
    } finally {
      this.adding = false;
    }
  }

  channelSummary(channel: ChannelItem): string {
    if (channel.kind === "telegram") {
      return "Messages persist into the same conversation history and bot runtime.";
    }
    return channel.phoneNumber
      ? `Meta Cloud API bound to ${channel.phoneNumber}.`
      : "Meta Cloud API channel ready for webhook verification.";
  }

  async confirmDelete(channel: ChannelItem): Promise<void> {
    const tenantId = this.store.activeTenantId();
    if (!tenantId || !confirm(`Remove this ${channel.kind} channel?`)) {
      return;
    }
    this.deleting = channel.id;
    try {
      await this.api.deleteChannel(tenantId, this.selectedProjectKey, channel.id);
      this.channels = this.channels.filter((item) => item.id !== channel.id);
    } finally {
      this.deleting = "";
    }
  }
}
