import { Component, OnInit, effect } from "@angular/core";
import { RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { CockpitStore } from "../cockpit-store.service";
import { PortalApiService } from "../../core/portal-api.service";
import { DocumentItem } from "../../core/models";

@Component({
  selector: "app-knowledge-documents",
  standalone: true,
  imports: [RouterModule, FormsModule],
  template: `
    <div class="ck-topbar">
      <div class="ck-topbar__breadcrumb">
        <a routerLink="/app/knowledge" style="color: var(--ck-text-muted); text-decoration: none;">Knowledge</a>
        <span>›</span>
        <strong>Documents</strong>
      </div>
      <div class="ck-topbar__actions">
        <span style="font-size: 0.84rem; color: var(--ck-text-muted);">{{ documents.length }} indexed</span>
      </div>
    </div>

    <div class="ck-content">
      <div class="ck-page-header">
        <div>
          <h1 class="ck-page-header__title">Documents</h1>
          <p class="ck-page-header__sub">Indexed knowledge chunks available to your bots</p>
        </div>
      </div>

      <div class="ck-toolbar">
        <div class="ck-search-wrap">
          <span class="ck-search-icon">⌕</span>
          <input class="ck-input ck-search" type="text" placeholder="Search documents..." [(ngModel)]="searchQuery" />
        </div>
        <select class="ck-select" style="width: auto; min-width: 140px;" [(ngModel)]="filterBot">
          <option value="">All bots</option>
          @for (key of botKeys; track key) {
            <option [value]="key">{{ key }}</option>
          }
        </select>
        <select class="ck-select" style="width: auto; min-width: 120px;" [(ngModel)]="filterType">
          <option value="">All types</option>
          <option value="web">Web</option>
          <option value="pdf">PDF</option>
          <option value="markdown">Markdown</option>
        </select>
      </div>

      @if (loading) {
        <div class="ck-card">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="ck-skeleton" style="height: 44px; margin-bottom: 8px;"></div>
          }
        </div>
      } @else if (filtered.length > 0) {
        <div class="ck-table-wrap">
          <table class="ck-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Bot</th>
                <th>Source</th>
                <th>Language</th>
                <th>Version</th>
                <th>Last ingested</th>
              </tr>
            </thead>
            <tbody>
              @for (doc of filtered; track doc.id) {
                <tr>
                  <td>
                    <div class="ck-table__cell--strong" style="max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" [title]="doc.title">
                      {{ doc.title }}
                    </div>
                    <a
                      [href]="doc.canonicalUrl"
                      target="_blank"
                      rel="noopener"
                      style="font-size: 0.72rem; color: var(--ck-text-muted); text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; max-width: 280px;"
                    >
                      {{ doc.canonicalUrl }}
                    </a>
                  </td>
                  <td><span class="ck-badge ck-badge--accent">{{ doc.projectKey }}</span></td>
                  <td class="ck-table__cell--mono" style="font-size: 0.75rem;">{{ doc.sourceKey }}</td>
                  <td style="color: var(--ck-text-muted);">{{ doc.language }}</td>
                  <td style="color: var(--ck-text-muted);">v{{ doc.currentVersion }}</td>
                  <td style="color: var(--ck-text-muted); font-size: 0.78rem;">
                    {{ doc.lastIngestedAt ? (doc.lastIngestedAt | date: 'MMM d, HH:mm') : '—' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <p style="font-size: 0.78rem; color: var(--ck-text-muted); margin-top: 12px;">
          Showing {{ filtered.length }} of {{ documents.length }} documents
        </p>
      } @else {
        <div class="ck-card">
          <div class="ck-empty">
            <div class="ck-empty__icon">≡</div>
            <p class="ck-empty__title">{{ searchQuery ? 'No documents found' : 'No documents indexed' }}</p>
            <p class="ck-empty__sub">
              {{ searchQuery ? 'Try a different search term.' : 'Add a knowledge source and run an ingestion job to index documents.' }}
            </p>
            @if (!searchQuery) {
              <a class="ck-btn ck-btn--secondary" routerLink="/app/knowledge">Manage Sources</a>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class KnowledgeDocumentsComponent implements OnInit {
  documents: DocumentItem[] = [];
  loading = true;
  searchQuery = "";
  filterBot = "";
  filterType = "";

  get botKeys(): string[] {
    return [...new Set(this.documents.map((d) => d.projectKey))];
  }

  get filtered(): DocumentItem[] {
    return this.documents.filter((d) => {
      const q = this.searchQuery.toLowerCase();
      const matchSearch =
        !q || d.title.toLowerCase().includes(q) || d.canonicalUrl.toLowerCase().includes(q);
      const matchBot = !this.filterBot || d.projectKey === this.filterBot;
      const matchType = !this.filterType || d.docType === this.filterType;
      return matchSearch && matchBot && matchType;
    });
  }

  constructor(
    private readonly store: CockpitStore,
    private readonly api: PortalApiService
  ) {
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
      this.documents = await this.api.tenantDocuments(tenantId);
    } finally {
      this.loading = false;
    }
  }
}
