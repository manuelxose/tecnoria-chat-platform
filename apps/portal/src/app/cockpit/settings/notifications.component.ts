import { Component, OnInit, effect } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { CockpitStore } from "../cockpit-store.service";
import { PortalApiService } from "../../core/portal-api.service";
import { NotificationPrefs } from "../../core/models";

@Component({
  selector: "app-notifications",
  standalone: true,
  imports: [RouterModule, FormsModule],
  template: `
    <div class="ck-topbar">
      <div class="ck-topbar__breadcrumb">
        <span>Settings</span>
        <span>›</span>
        <strong>Notifications</strong>
      </div>
    </div>

    <div class="ck-content">
      <div class="ck-page-header">
        <div>
          <h1 class="ck-page-header__title">Notification Preferences</h1>
          <p class="ck-page-header__sub">Configure email alerts for your workspace</p>
        </div>
      </div>

      @if (prefs) {
        <div style="max-width: 560px; display: grid; gap: 16px;">

          <!-- Email recipients -->
          <div class="ck-card">
            <div class="ck-card__header">
              <p class="ck-card__title">Email Recipients</p>
            </div>
            <p style="font-size: 0.82rem; color: var(--ck-text-soft); margin-bottom: 10px;">Comma-separated email addresses</p>
            <textarea
              class="ck-input"
              rows="3"
              style="resize: vertical;"
              [ngModel]="prefs.emailRecipients.join(', ')"
              (ngModelChange)="setRecipients($event)"
            ></textarea>
          </div>

          <!-- Alerts -->
          <div class="ck-card">
            <div class="ck-card__header">
              <p class="ck-card__title">Alerts</p>
            </div>
            <div style="display: grid; gap: 14px;">
              <label style="display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                <div>
                  <p style="font-size: 0.84rem; font-weight: 500; color: var(--ck-text);">Lead captured</p>
                  <p style="font-size: 0.78rem; color: var(--ck-text-muted);">When a contact submits their info via the chatbot</p>
                </div>
                <input type="checkbox" [(ngModel)]="prefs.leadCreated" />
              </label>
              <label style="display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                <div>
                  <p style="font-size: 0.84rem; font-weight: 500; color: var(--ck-text);">Ingestion failed</p>
                  <p style="font-size: 0.78rem; color: var(--ck-text-muted);">When a knowledge source crawl job fails</p>
                </div>
                <input type="checkbox" [(ngModel)]="prefs.ingestionFailed" />
              </label>
              <label style="display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                <div>
                  <p style="font-size: 0.84rem; font-weight: 500; color: var(--ck-text);">Low confidence alert</p>
                  <p style="font-size: 0.78rem; color: var(--ck-text-muted);">When responses fall below your confidence threshold</p>
                </div>
                <input type="checkbox" [(ngModel)]="prefs.lowConfidenceAlert" />
              </label>
              @if (prefs.lowConfidenceAlert) {
                <div style="padding-left: 16px; border-left: 2px solid var(--ck-border);">
                  <label style="font-size: 0.82rem; color: var(--ck-text-soft); display: block; margin-bottom: 4px;">
                    Threshold (0–1): {{ prefs.lowConfidenceThreshold }}
                  </label>
                  <input type="range" min="0" max="1" step="0.05" [(ngModel)]="prefs.lowConfidenceThreshold" style="width: 100%;" />
                </div>
              }
            </div>
          </div>

          <!-- Digest -->
          <div class="ck-card">
            <div class="ck-card__header">
              <p class="ck-card__title">Digest Email</p>
            </div>
            <select class="ck-select" [(ngModel)]="prefs.digestFrequency">
              <option value="none">No digest</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          <div style="display: flex; gap: 10px;">
            <button class="ck-btn ck-btn--primary" (click)="save()" [disabled]="saving">
              {{ saving ? 'Saving…' : 'Save Preferences' }}
            </button>
            @if (savedMsg) {
              <span style="font-size: 0.84rem; color: var(--ck-accent-strong); align-self: center;">{{ savedMsg }}</span>
            }
          </div>
        </div>
      } @else {
        <div class="ck-card">
          @for (i of [1, 2, 3]; track i) {
            <div class="ck-skeleton" style="height: 40px; margin-bottom: 10px;"></div>
          }
        </div>
      }
    </div>
  `,
})
export class NotificationsComponent implements OnInit {
  prefs: NotificationPrefs | null = null;
  saving = false;
  savedMsg = "";

  constructor(readonly store: CockpitStore, private readonly api: PortalApiService) {
    effect(() => {
      const id = this.store.activeTenantId();
      if (id) this.load(id);
    });
  }

  ngOnInit(): void {}

  private async load(tenantId: string): Promise<void> {
    this.prefs = await this.api.getNotificationPrefs(tenantId);
  }

  setRecipients(value: string): void {
    if (!this.prefs) return;
    this.prefs.emailRecipients = value.split(",").map((e) => e.trim()).filter(Boolean);
  }

  async save(): Promise<void> {
    const id = this.store.activeTenantId();
    if (!id || !this.prefs) return;
    this.saving = true;
    try {
      this.prefs = await this.api.updateNotificationPrefs(id, this.prefs);
      this.savedMsg = "Saved!";
      setTimeout(() => (this.savedMsg = ""), 3000);
    } finally {
      this.saving = false;
    }
  }
}
