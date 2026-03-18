import { Component, OnInit, effect } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { CockpitStore } from "../cockpit-store.service";
import { PortalApiService } from "../../core/portal-api.service";
import { WorkspaceMember } from "../../core/models";

@Component({
  selector: "app-members",
  standalone: true,
  imports: [RouterModule, FormsModule],
  template: `
    <div class="ck-topbar">
      <div class="ck-topbar__breadcrumb">
        <span>Settings</span>
        <span>›</span>
        <strong>Members</strong>
      </div>
    </div>

    <div class="ck-content">
      <div class="ck-page-header">
        <div>
          <h1 class="ck-page-header__title">Members</h1>
          <p class="ck-page-header__sub">Manage workspace access and roles</p>
        </div>
        <button class="ck-btn ck-btn--primary ck-btn--sm" (click)="inviteOpen = true">+ Invite</button>
      </div>

      @if (inviteOpen) {
        <div class="ck-card" style="margin-bottom: 20px; border-color: var(--ck-accent-soft);">
          <div class="ck-card__header">
            <p class="ck-card__title">Invite Member</p>
            <button class="ck-btn ck-btn--ghost ck-btn--sm" (click)="inviteOpen = false">✕</button>
          </div>
          <div style="display: grid; grid-template-columns: 1fr auto auto; gap: 10px; align-items: center;">
            <input class="ck-input" type="email" placeholder="email@example.com" [(ngModel)]="inviteEmail" />
            <select class="ck-select" [(ngModel)]="inviteRole">
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
              <option value="admin">Admin</option>
            </select>
            <button class="ck-btn ck-btn--primary ck-btn--sm" (click)="sendInvite()" [disabled]="sending">
              {{ sending ? 'Sending…' : 'Send Invite' }}
            </button>
          </div>
          @if (inviteMsg) {
            <p style="margin-top: 8px; font-size: 0.82rem; color: var(--ck-accent-strong);">{{ inviteMsg }}</p>
          }
        </div>
      }

      <div class="ck-table-wrap">
        <table class="ck-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (m of members; track m.userId) {
              <tr>
                <td>
                  <div style="display: flex; flex-direction: column; gap: 2px;">
                    <span style="font-size: 0.84rem; color: var(--ck-text);">{{ m.displayName ?? m.email }}</span>
                    @if (m.displayName) {
                      <span style="font-size: 0.78rem; color: var(--ck-text-muted);">{{ m.email }}</span>
                    }
                  </div>
                </td>
                <td>
                  <select class="ck-select" style="width: auto;" [(ngModel)]="m.role" (ngModelChange)="updateRole(m)">
                    <option value="admin">admin</option>
                    <option value="editor">editor</option>
                    <option value="viewer">viewer</option>
                  </select>
                </td>
                <td><span class="ck-badge" [class]="statusBadge(m.status)">{{ m.status }}</span></td>
                <td style="font-size: 0.8rem; color: var(--ck-text-muted);">{{ m.joinedAt | slice:0:10 }}</td>
                <td>
                  <button class="ck-btn ck-btn--ghost ck-btn--sm" style="color: var(--ck-red);" (click)="remove(m)">Remove</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5" style="text-align: center; color: var(--ck-text-muted);">No members yet</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class MembersComponent implements OnInit {
  members: WorkspaceMember[] = [];
  inviteOpen = false;
  inviteEmail = "";
  inviteRole: "admin" | "editor" | "viewer" = "editor";
  inviteMsg = "";
  sending = false;

  constructor(readonly store: CockpitStore, private readonly api: PortalApiService) {
    effect(() => {
      const id = this.store.activeTenantId();
      if (id) this.load(id);
    });
  }

  ngOnInit(): void {}

  private async load(tenantId: string): Promise<void> {
    this.members = await this.api.tenantMembers(tenantId);
  }

  async updateRole(m: WorkspaceMember): Promise<void> {
    const id = this.store.activeTenantId();
    if (!id) return;
    await this.api.updateMemberRole(id, m.userId, m.role);
  }

  async remove(m: WorkspaceMember): Promise<void> {
    const id = this.store.activeTenantId();
    if (!id || !confirm(`Remove ${m.email}?`)) return;
    await this.api.removeMember(id, m.userId);
    this.members = this.members.filter((x) => x.userId !== m.userId);
  }

  async sendInvite(): Promise<void> {
    const id = this.store.activeTenantId();
    if (!id || !this.inviteEmail) return;
    this.sending = true;
    try {
      await this.api.inviteMember(id, { email: this.inviteEmail, role: this.inviteRole });
      this.inviteMsg = `Invitation sent to ${this.inviteEmail}`;
      this.inviteEmail = "";
    } finally {
      this.sending = false;
    }
  }

  statusBadge(s: string): string {
    return s === "active" ? "ck-badge--success" : s === "disabled" ? "ck-badge--error" : "ck-badge--default";
  }
}
