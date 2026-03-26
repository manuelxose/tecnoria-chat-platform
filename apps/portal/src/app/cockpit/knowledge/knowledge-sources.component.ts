import { Component, OnInit, effect } from "@angular/core";
import { RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { CockpitStore } from "../cockpit-store.service";
import { PortalApiService } from "../../core/portal-api.service";
import { SourceItem, Project } from "../../core/models";

@Component({
  selector: "app-knowledge-sources",
  standalone: true,
  imports: [RouterModule, FormsModule],
  template: `
    <div class="ck-content">
      <div class="ck-page-header">
        <div>
          <h1 class="ck-page-header__title">Knowledge Sources</h1>
          <p class="ck-page-header__sub">Advanced and manually managed data sources powering your bots.</p>
        </div>
        <div class="ck-page-header__actions">
          <a class="ck-btn ck-btn--secondary ck-btn--sm" routerLink="/app/knowledge/documents">Documents</a>
          <a class="ck-btn ck-btn--secondary ck-btn--sm" routerLink="/app/knowledge/ingestions">Jobs</a>
        </div>
      </div>

      <div class="ck-grid-sidebar">
        <!-- Sources table -->
        <div>
          @if (loading) {
            <div class="ck-card">
              @for (i of [1,2,3]; track i) {
                <div class="ck-skeleton ck-auto-031"></div>
              }
            </div>
          } @else if (sources.length > 0) {
            <div class="ck-table-wrap">
              <table class="ck-table">
                <thead>
                  <tr>
                    <th>Source Key</th>
                    <th>Bot</th>
                    <th>Type</th>
                    <th>Entry URL</th>
                    <th>Visibility</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (src of sources; track src.id) {
                    <tr>
                      <td class="ck-table__cell--mono">{{ src.sourceKey ?? src.source_key }}</td>
                      <td><span class="ck-badge ck-badge--accent">{{ src.projectKey }}</span></td>
                      <td>
                        <span class="ck-badge" [class]="kindBadge(src.kind)">{{ src.kind }}</span>
                      </td>
                      <td class="ck-auto-172">
                        {{ src.entryUrl ?? src.entry_url }}
                      </td>
                      <td>
                        <span class="ck-badge" [class]="src.visibility === 'public' ? 'ck-badge ck-badge--success' : 'ck-badge ck-badge--default'">
                          {{ src.visibility }}
                        </span>
                      </td>
                      <td>
                        <button class="ck-btn ck-btn--ghost ck-btn--sm" (click)="syncSource(src)">
                          {{ syncingId === src.id ? '↻ Syncing…' : '↻ Sync' }}
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
                <div class="ck-empty__icon">◫</div>
                <p class="ck-empty__title">No sources connected</p>
                <p class="ck-empty__sub">Add a knowledge source to give your bot information to work with.</p>
              </div>
            </div>
          }
        </div>

        <!-- Add source form -->
        <div class="ck-card">
          <div class="ck-card__header">
            <p class="ck-card__title">Add Source</p>
          </div>
          @if (addSuccess) {
            <div class="ck-alert ck-alert--success ck-auto-033">Source added successfully.</div>
          }
          @if (addError) {
            <div class="ck-alert ck-alert--danger ck-auto-033">{{ addError }}</div>
          }
          <div class="ck-form-stack">
            <div class="ck-field">
              <label class="ck-label">Bot (project)</label>
              <select class="ck-select" [(ngModel)]="form.projectKey">
                @for (p of projects; track p.projectKey) {
                  <option [value]="p.projectKey">{{ p.botName }} ({{ p.projectKey }})</option>
                }
              </select>
            </div>
            <div class="ck-field">
              <label class="ck-label">Source Key</label>
              <input class="ck-input" [(ngModel)]="form.sourceKey" placeholder="public-web" />
            </div>
            <div class="ck-field">
              <label class="ck-label">Type</label>
              <select class="ck-select" [(ngModel)]="form.kind">
                <option value="sitemap">Sitemap</option>
                <option value="html">HTML Page</option>
                <option value="pdf">PDF</option>
                <option value="markdown">Markdown</option>
                <option value="api_endpoint">API Endpoint</option>
                <option value="youtube">YouTube</option>
                <option value="notion">Notion</option>
                <option value="gemini_file">Gemini (video/audio/image)</option>
              </select>
            </div>
            <div class="ck-field">
              <label class="ck-label">
                @if (form.kind === 'youtube') { Video / Playlist URL }
                @else if (form.kind === 'notion') { Page or Database URL / ID }
                @else if (form.kind === 'gemini_file') { File URL }
                @else { Entry URL }
              </label>
              <input class="ck-input" [(ngModel)]="form.entryUrl"
                [placeholder]="form.kind === 'youtube' ? 'https://www.youtube.com/watch?v=...' : form.kind === 'notion' ? 'https://www.notion.so/...' : form.kind === 'gemini_file' ? 'https://example.com/video.mp4' : 'https://example.com/sitemap.xml'" />
            </div>
            @if (form.kind === 'youtube') {
              <div class="ck-field">
                <label class="ck-label">Document Title (optional)</label>
                <input class="ck-input" [(ngModel)]="form.apiTitle" placeholder="My video series" />
              </div>
              <div class="ck-field">
                <label class="ck-label">Transcript Language</label>
                <input class="ck-input" [(ngModel)]="form.ytLang" placeholder="es" />
                <p class="ck-label ck-auto-173">ISO 639-1 code, e.g. es, en, fr</p>
              </div>
            }
            @if (form.kind === 'notion') {
              <div class="ck-field">
                <label class="ck-label">Notion Integration Token</label>
                <input class="ck-input" [(ngModel)]="form.notionToken" type="password" placeholder="secret_..." />
                <p class="ck-label ck-auto-173">Internal integration token from notion.so/my-integrations</p>
              </div>
            }
            @if (form.kind === 'gemini_file') {
              <div class="ck-field">
                <label class="ck-label">Media Type</label>
                <select class="ck-select" [(ngModel)]="form.geminiMediaType">
                  <option value="video/mp4">Video MP4</option>
                  <option value="video/webm">Video WebM</option>
                  <option value="audio/mpeg">Audio MP3</option>
                  <option value="audio/wav">Audio WAV</option>
                  <option value="image/jpeg">Image JPEG</option>
                  <option value="image/png">Image PNG</option>
                  <option value="application/pdf">PDF (multimodal)</option>
                </select>
              </div>
              <div class="ck-field">
                <label class="ck-label">Extraction Prompt (optional)</label>
                <input class="ck-input" [(ngModel)]="form.geminiPrompt"
                  placeholder="Extrae los puntos clave de este contenido…" />
              </div>
              <div class="ck-field">
                <label class="ck-label">Title</label>
                <input class="ck-input" [(ngModel)]="form.geminiTitle" placeholder="Nombre descriptivo" />
              </div>
            }
            @if (form.kind === 'api_endpoint') {
              <div class="ck-field">
                <label class="ck-label">Document Title</label>
                <input class="ck-input" [(ngModel)]="form.apiTitle" placeholder="My API content" />
              </div>
              <div class="ck-field">
                <label class="ck-label">Custom Headers (JSON)</label>
                <textarea class="ck-textarea" [(ngModel)]="form.apiHeaders" rows="3"
                  placeholder='&#123;"Authorization": "Bearer TOKEN"&#125;'></textarea>
                <p class="ck-label ck-auto-173">Optional JSON object with request headers</p>
              </div>
              <div class="ck-field">
                <label class="ck-label">JSON Content Path</label>
                <input class="ck-input" [(ngModel)]="form.apiContentPath" placeholder="data.items" />
                <p class="ck-label ck-auto-173">Optional dot-path to extract from the response (e.g. data.items)</p>
              </div>
            }
            <div class="ck-field">
              <label class="ck-label">Visibility</label>
              <select class="ck-select" [(ngModel)]="form.visibility">
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
            <div class="ck-divider"></div>
            <div class="ck-field">
              <label class="ck-label">Upload Local Document</label>
              <div class="ck-upload-row">
                <input
                  #documentUploadInput
                  class="ck-input"
                  type="file"
                  accept=".pdf,.md,.markdown,.txt,.html,.htm,text/markdown,text/plain,text/html,application/pdf"
                  (change)="onDocumentSelected($event)"
                />
                <button
                  class="ck-btn ck-btn--secondary ck-btn--sm"
                  type="button"
                  (click)="uploadDocument()"
                  [disabled]="uploadingDocument || !documentUploadName"
                >
                  {{ uploadingDocument ? 'Uploading…' : 'Upload Document' }}
                </button>
              </div>
              <p class="ck-label ck-auto-173">
                Uploads are stored locally, a private source is created or reused, and an ingestion job is queued automatically.
              </p>
              @if (documentUploadName) {
                <p class="ck-text-xs ck-text-soft">Selected: {{ documentUploadName }}</p>
              }
              @if (documentUploadSuccess) {
                <p class="ck-text-xs ck-text-success">{{ documentUploadSuccess }}</p>
              }
              @if (documentUploadError) {
                <p class="ck-text-xs ck-text-danger">{{ documentUploadError }}</p>
              }
            </div>
            <button class="ck-btn ck-btn--primary ck-auto-034" (click)="addSource()" [disabled]="adding">
              {{ adding ? 'Adding…' : 'Add Source' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class KnowledgeSourcesComponent implements OnInit {
  sources: SourceItem[] = [];
  projects: Project[] = [];
  loading = true;
  adding = false;
  addSuccess = false;
  addError = "";
  syncingId = "";
  documentUploadName = "";
  documentUploadError = "";
  documentUploadSuccess = "";
  uploadingDocument = false;
  private selectedDocumentFile: File | null = null;

  form = {
    projectKey: "",
    sourceKey: "public-web",
    kind: "sitemap",
    entryUrl: "",
    visibility: "public",
    apiTitle: "",
    apiHeaders: "",
    apiContentPath: "",
    ytLang: "es",
    notionToken: "",
    geminiMediaType: "video/mp4",
    geminiPrompt: "",
    geminiTitle: "",
  };

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
      [this.sources, this.projects] = await Promise.all([
        this.api.tenantSources(tenantId),
        this.api.tenantProjects(tenantId),
      ]);
      if (this.projects.length && !this.form.projectKey) {
        this.form.projectKey = this.projects[0].projectKey;
      }
    } finally {
      this.loading = false;
    }
  }

  async addSource(): Promise<void> {
    const tenantId = this.store.activeTenantId();
    if (!tenantId) return;
    this.adding = true;
    this.addError = "";
    try {
      let sourceConfig: Record<string, unknown> | undefined;
      if (this.form.kind === "api_endpoint") {
        let headers: Record<string, string> = {};
        if (this.form.apiHeaders.trim()) {
          try { headers = JSON.parse(this.form.apiHeaders); } catch { throw new Error("Custom headers must be valid JSON."); }
        }
        sourceConfig = {
          title: this.form.apiTitle || this.form.sourceKey,
          headers,
          ...(this.form.apiContentPath ? { contentPath: this.form.apiContentPath } : {}),
        };
      } else if (this.form.kind === "youtube") {
        sourceConfig = {
          ...(this.form.apiTitle ? { title: this.form.apiTitle } : {}),
          lang: this.form.ytLang || "es",
        };
      } else if (this.form.kind === "notion") {
        if (!this.form.notionToken.trim()) throw new Error("Notion integration token is required.");
        sourceConfig = { token: this.form.notionToken.trim() };
      } else if (this.form.kind === "gemini_file") {
        sourceConfig = {
          mediaType: this.form.geminiMediaType,
          ...(this.form.geminiPrompt.trim() ? { prompt: this.form.geminiPrompt.trim() } : {}),
          ...(this.form.geminiTitle.trim() ? { title: this.form.geminiTitle.trim() } : {}),
        };
      }
      await this.api.upsertSource(tenantId, { ...this.form, sourceConfig });
      this.addSuccess = true;
      this.form.sourceKey = "public-web";
      this.form.entryUrl = "";
      this.form.apiTitle = "";
      this.form.apiHeaders = "";
      this.form.apiContentPath = "";
      this.form.ytLang = "es";
      this.form.notionToken = "";
      this.form.geminiPrompt = "";
      this.form.geminiTitle = "";
      await this.load(tenantId);
      setTimeout(() => (this.addSuccess = false), 3000);
    } catch (e: any) {
      this.addError = e?.message ?? "Failed to add source.";
    } finally {
      this.adding = false;
    }
  }

  async syncSource(src: SourceItem): Promise<void> {
    const tenantId = this.store.activeTenantId();
    if (!tenantId) return;
    this.syncingId = src.id;
    try {
      await this.api.queueIngestion(tenantId, {
        projectKey: src.projectKey,
        sourceKey: src.sourceKey ?? src.source_key,
      });
    } finally {
      this.syncingId = "";
    }
  }

  onDocumentSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;
    this.selectedDocumentFile = file;
    this.documentUploadName = file?.name ?? "";
    this.documentUploadError = "";
    this.documentUploadSuccess = "";
  }

  async uploadDocument(): Promise<void> {
    const tenantId = this.store.activeTenantId();
    if (!tenantId || !this.form.projectKey || !this.selectedDocumentFile) {
      return;
    }

    this.uploadingDocument = true;
    this.documentUploadError = "";
    this.documentUploadSuccess = "";
    try {
      const uploaded = await this.api.uploadKnowledgeDocument(
        tenantId,
        this.form.projectKey,
        this.selectedDocumentFile,
        this.form.sourceKey || undefined,
      );
      this.documentUploadSuccess = `Queued ingestion for ${uploaded.filename}${uploaded.jobId ? ` · job ${uploaded.jobId.slice(0, 8)}…` : ""}.`;
      this.selectedDocumentFile = null;
      this.documentUploadName = "";
      await this.load(tenantId);
    } catch (e: any) {
      this.documentUploadError = e?.message ?? "Failed to upload document.";
    } finally {
      this.uploadingDocument = false;
    }
  }

  kindBadge(kind: string): string {
    switch (kind) {
      case "sitemap": return "ck-badge ck-badge--info";
      case "html": return "ck-badge ck-badge--accent";
      case "pdf": return "ck-badge ck-badge--warning";
      case "markdown": return "ck-badge ck-badge--success";
      case "api_endpoint": return "ck-badge ck-badge--warning";
      case "youtube": return "ck-badge ck-badge--danger";
      case "notion": return "ck-badge ck-badge--default";
      case "gemini_file": return "ck-badge ck-badge--info";
      default: return "ck-badge ck-badge--default";
    }
  }
}
