import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import {
  ConversationItem,
  DocumentItem,
  IngestionItem,
  LeadItem,
  MessageItem,
  Project,
  SourceItem,
  Tenant,
} from "../core/models";
import { PortalApiService } from "../core/portal-api.service";
import { SessionStore } from "../core/session.store";
import { DEFAULT_PORTAL_SETTINGS } from "../content/public-site";
import { SeoService } from "../services/seo.service";
import { buildNoIndexSeo } from "../services/seo-utils";

@Component({
  selector: "app-tenant-dashboard-page",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <section class="dashboard-shell">
      <div class="site-shell">
        <header class="dashboard-header surface-card">
            <div>
              <span class="eyebrow">Tenant console</span>
            <h1>Workspace operativo de Talkaris</h1>
            <p>Gestiona proyectos, fuentes, ingestas, documentos, leads y conversaciones por tenant.</p>
          </div>

          <div class="dashboard-header__actions">
            <label class="compact-field">
              <span>Tenant</span>
              <select [(ngModel)]="selectedTenantId" (ngModelChange)="handleTenantChange()">
                @for (tenant of tenants; track tenant.id) {
                  <option [value]="tenant.id">{{ tenant.name }}</option>
                }
              </select>
            </label>
            @if (session.user()) {
              <div class="session-pill">
                <strong>{{ session.user()?.email }}</strong>
                <span>{{ session.user()?.platformRole }}</span>
              </div>
            }
            <a class="button button-secondary" routerLink="/admin" *ngIf="session.user()?.platformRole === 'superadmin'">
              Ir a superadmin
            </a>
            <button class="button button-secondary" type="button" (click)="logout()">Cerrar sesion</button>
          </div>
        </header>

        @if (tenantOverview) {
          <section class="dashboard-grid dashboard-grid--three">
            <article class="surface-card stat-card">
              <span class="eyebrow">Proyectos</span>
              <strong>{{ tenantOverview.stats["projects"] }}</strong>
              <p>Integraciones aisladas por aplicacion.</p>
            </article>
            <article class="surface-card stat-card">
              <span class="eyebrow">Fuentes</span>
              <strong>{{ tenantOverview.stats["sources"] }}</strong>
              <p>Orígenes de conocimiento conectados al tenant.</p>
            </article>
            <article class="surface-card stat-card">
              <span class="eyebrow">Conversaciones</span>
              <strong>{{ tenantOverview.stats["conversations"] }}</strong>
              <p>Historial operativo del tenant.</p>
            </article>
          </section>
        }

        <section class="dashboard-columns">
          <article class="surface-card">
            <div class="section-head">
              <div>
                <span class="eyebrow">Proyecto</span>
                <h2>Alta o actualizacion</h2>
              </div>
              <div class="inline-links">
                @if (snippetText) {
                  <button class="button button-secondary" type="button" (click)="snippetText = ''">Ocultar snippet</button>
                }
              </div>
            </div>

            <form class="stack-form" (ngSubmit)="saveProject()">
              <div class="form-grid">
                <label>
                  <span>Project key</span>
                  <input [(ngModel)]="projectForm.projectKey" name="projectKey" required />
                </label>
                <label>
                  <span>Nombre</span>
                  <input [(ngModel)]="projectForm.name" name="projectName" required />
                </label>
              </div>

              <div class="form-grid">
                <label>
                  <span>Bot name</span>
                  <input [(ngModel)]="projectForm.botName" name="botName" required />
                </label>
                <label>
                  <span>Status</span>
                  <select [(ngModel)]="projectForm.status" name="status">
                    <option value="active">active</option>
                    <option value="draft">draft</option>
                    <option value="disabled">disabled</option>
                  </select>
                </label>
              </div>

              <label>
                <span>Allowed domains</span>
                <input [(ngModel)]="projectForm.allowedDomainsText" name="allowedDomains" placeholder="talkaris.com, app.cliente.com" />
              </label>

              <label>
                <span>Welcome message</span>
                <textarea [(ngModel)]="projectForm.welcomeMessage" name="welcomeMessage" rows="4"></textarea>
              </label>

              <div class="form-grid">
                <label>
                  <span>CTA primaria</span>
                  <input [(ngModel)]="projectForm.ctaPrimaryLabel" name="ctaPrimaryLabel" />
                </label>
                <label>
                  <span>URL CTA primaria</span>
                  <input [(ngModel)]="projectForm.ctaPrimaryUrl" name="ctaPrimaryUrl" />
                </label>
              </div>

              <div class="form-grid">
                <label>
                  <span>Launcher label</span>
                  <input [(ngModel)]="projectForm.launcherLabel" name="launcherLabel" />
                </label>
                <label>
                  <span>Accent color</span>
                  <input [(ngModel)]="projectForm.accentColor" name="accentColor" />
                </label>
              </div>

              <div class="form-grid">
                <label>
                  <span>Surface color</span>
                  <input [(ngModel)]="projectForm.surfaceColor" name="surfaceColor" />
                </label>
                <label>
                  <span>Text color</span>
                  <input [(ngModel)]="projectForm.textColor" name="textColor" />
                </label>
              </div>

              <label>
                <span>Tono</span>
                <input [(ngModel)]="projectForm.promptTone" name="promptTone" />
              </label>

              <button class="button button-primary" type="submit" [disabled]="savingProject">
                {{ savingProject ? "Guardando..." : "Guardar proyecto" }}
              </button>
            </form>

            @if (snippetText) {
              <pre class="code-block">{{ snippetText }}</pre>
            }
          </article>

          <article class="surface-card">
            <div class="section-head">
              <div>
                <span class="eyebrow">Fuentes e ingestas</span>
                <h2>Operacion de conocimiento</h2>
              </div>
            </div>

            <form class="stack-form" (ngSubmit)="saveSource()">
              <div class="form-grid">
                <label>
                  <span>Proyecto</span>
                  <select [(ngModel)]="sourceForm.projectKey" name="sourceProjectKey">
                    @for (project of projects; track project.projectKey) {
                      <option [value]="project.projectKey">{{ project.projectKey }}</option>
                    }
                  </select>
                </label>
                <label>
                  <span>Source key</span>
                  <input [(ngModel)]="sourceForm.sourceKey" name="sourceKey" required />
                </label>
              </div>

              <div class="form-grid">
                <label>
                  <span>Kind</span>
                  <select [(ngModel)]="sourceForm.kind" name="kind">
                    <option value="sitemap">sitemap</option>
                    <option value="html">html</option>
                    <option value="pdf">pdf</option>
                    <option value="markdown">markdown</option>
                  </select>
                </label>
                <label>
                  <span>Entry URL</span>
                  <input [(ngModel)]="sourceForm.entryUrl" name="entryUrl" required />
                </label>
              </div>

              <button class="button button-secondary" type="submit" [disabled]="savingSource">
                {{ savingSource ? "Guardando..." : "Guardar fuente" }}
              </button>
            </form>

            <form class="stack-form stack-form--inline" (ngSubmit)="queueIngestion()">
              <label>
                <span>Proyecto</span>
                <select [(ngModel)]="ingestionForm.projectKey" name="ingestionProjectKey">
                  @for (project of projects; track project.projectKey) {
                    <option [value]="project.projectKey">{{ project.projectKey }}</option>
                  }
                </select>
              </label>
              <label>
                <span>Source key</span>
                <input [(ngModel)]="ingestionForm.sourceKey" name="ingestionSourceKey" />
              </label>
              <button class="button button-primary" type="submit" [disabled]="queuingIngestion">
                {{ queuingIngestion ? "Lanzando..." : "Lanzar ingesta" }}
              </button>
            </form>
          </article>
        </section>

        <section class="dashboard-grid dashboard-grid--two">
          <article class="surface-card">
            <div class="section-head">
              <div>
                <span class="eyebrow">Proyectos</span>
                <h2>Listado del tenant</h2>
              </div>
            </div>

            <div class="record-list">
              @for (project of projects; track project.id) {
                <article class="record-card">
                  <div>
                    <strong>{{ project.name }}</strong>
                    <span>{{ project.projectKey }} · {{ project.status }}</span>
                  </div>
                  <div class="record-actions">
                    <button class="button button-secondary" type="button" (click)="useProject(project)">Editar</button>
                    <button class="button button-secondary" type="button" (click)="loadSnippet(project.projectKey)">Snippet</button>
                    <button class="button button-secondary" type="button" (click)="loadAnalytics(project.projectKey)">Analytics</button>
                  </div>
                </article>
              } @empty {
                <p class="empty-copy">Todavia no hay proyectos registrados para este tenant.</p>
              }
            </div>
          </article>

          <article class="surface-card">
            <div class="section-head">
              <div>
                <span class="eyebrow">Analytics</span>
                <h2>Resumen por proyecto</h2>
              </div>
            </div>

            @if (analyticsSummary) {
              <div class="record-list">
                @for (event of analyticsSummary.events; track event.eventType) {
                  <article class="record-card">
                    <strong>{{ event.eventType }}</strong>
                    <span>{{ event.total }}</span>
                  </article>
                }
              </div>
            } @else {
              <p class="empty-copy">Selecciona un proyecto para cargar analitica.</p>
            }
          </article>
        </section>

        <section class="dashboard-grid dashboard-grid--two">
          <article class="surface-card">
            <div class="section-head">
              <div>
                <span class="eyebrow">Fuentes</span>
                <h2>Listado operativo</h2>
              </div>
            </div>
            <div class="record-list">
              @for (source of sources; track source.id) {
                <article class="record-card">
                  <div>
                    <strong>{{ source.projectKey }} / {{ source.sourceKey || source.source_key }}</strong>
                    <span>{{ source.kind }} · {{ source.visibility }}</span>
                  </div>
                </article>
              } @empty {
                <p class="empty-copy">No hay fuentes registradas.</p>
              }
            </div>
          </article>

          <article class="surface-card">
            <div class="section-head">
              <div>
                <span class="eyebrow">Ingestas</span>
                <h2>Jobs recientes</h2>
              </div>
            </div>
            <div class="record-list">
              @for (job of ingestions; track job.id) {
                <article class="record-card">
                  <div>
                    <strong>{{ job.projectKey }} / {{ job.sourceKey }}</strong>
                    <span>{{ job.status }} · {{ job.createdAt | date: "short" }}</span>
                  </div>
                </article>
              } @empty {
                <p class="empty-copy">No hay ingestas recientes.</p>
              }
            </div>
          </article>
        </section>

        <section class="dashboard-grid dashboard-grid--three">
          <article class="surface-card">
            <div class="section-head">
              <div>
                <span class="eyebrow">Documentos</span>
                <h2>Versionado operativo</h2>
              </div>
            </div>
            <div class="record-list compact-list">
              @for (document of documents; track document.id) {
                <article class="record-card">
                  <strong>{{ document.title }}</strong>
                  <span>{{ document.projectKey }} · v{{ document.currentVersion }}</span>
                </article>
              } @empty {
                <p class="empty-copy">No hay documentos indexados.</p>
              }
            </div>
          </article>

          <article class="surface-card">
            <div class="section-head">
              <div>
                <span class="eyebrow">Leads</span>
                <h2>Eventos recientes</h2>
              </div>
            </div>
            <div class="record-list compact-list">
              @for (lead of leads; track lead.id) {
                <article class="record-card">
                  <strong>{{ lead.projectKey || lead.projectId }}</strong>
                  <span>{{ lead.deliveryStatus }} · {{ lead.createdAt | date: "short" }}</span>
                </article>
              } @empty {
                <p class="empty-copy">No hay leads registrados.</p>
              }
            </div>
          </article>

          <article class="surface-card">
            <div class="section-head">
              <div>
                <span class="eyebrow">Conversaciones</span>
                <h2>Lectura operativa</h2>
              </div>
            </div>
            <div class="record-list compact-list">
              @for (conversation of conversations; track conversation.id) {
                <article class="record-card">
                  <div>
                    <strong>{{ conversation.projectKey }}</strong>
                    <span>{{ conversation.messageCount }} mensajes</span>
                  </div>
                  <button class="button button-secondary" type="button" (click)="inspectConversation(conversation)">
                    Ver
                  </button>
                </article>
              } @empty {
                <p class="empty-copy">Todavia no hay conversaciones.</p>
              }
            </div>
          </article>
        </section>

        @if (selectedConversation) {
          <section class="surface-card">
            <div class="section-head">
              <div>
                <span class="eyebrow">Detalle</span>
                <h2>Conversacion {{ selectedConversation.id }}</h2>
              </div>
            </div>
            <div class="message-thread">
              @for (message of conversationMessages; track message.id) {
                <article class="message-thread__item">
                  <strong>{{ message.role }}</strong>
                  <p>{{ message.body }}</p>
                </article>
              }
            </div>
          </section>
        }
      </div>
    </section>
  `,
})
export class TenantDashboardPageComponent implements OnInit {
  tenants: Tenant[] = [];
  selectedTenantId = "";
  tenantOverview: { tenant: Tenant; stats: Record<string, number>; recentJobs: IngestionItem[] } | null = null;
  projects: Project[] = [];
  sources: SourceItem[] = [];
  ingestions: IngestionItem[] = [];
  documents: DocumentItem[] = [];
  leads: LeadItem[] = [];
  conversations: ConversationItem[] = [];
  conversationMessages: MessageItem[] = [];
  selectedConversation: ConversationItem | null = null;
  analyticsSummary:
    | {
        projectKey: string;
        events: Array<{ eventType: string; total: number }>;
        unanswered: Array<{ message: string; total: number }>;
        leads: Array<{ deliveryStatus: string; total: number }>;
      }
    | null = null;
  snippetText = "";

  savingProject = false;
  savingSource = false;
  queuingIngestion = false;

  projectForm = {
    projectKey: "",
    name: "",
    status: "active",
    botName: "Asistente",
    allowedDomainsText: "",
    welcomeMessage: "",
    ctaPrimaryLabel: "Pedir reunion",
    ctaPrimaryUrl: "",
    launcherLabel: "Hablar con el asistente",
    accentColor: "#6366f1",
    surfaceColor: "#0f172a",
    textColor: "#f8fafc",
    promptTone: "profesional, sobrio y orientado a negocio",
  };

  sourceForm = {
    projectKey: "",
    sourceKey: "public-web",
    kind: "sitemap",
    entryUrl: "",
  };

  ingestionForm = {
    projectKey: "",
    sourceKey: "public-web",
  };

  constructor(
    readonly session: SessionStore,
    private readonly api: PortalApiService,
    private readonly router: Router,
    private readonly seo: SeoService
  ) {}

  async ngOnInit(): Promise<void> {
    this.seo.update(
      buildNoIndexSeo(
        "Tenant console",
        "Private operational workspace for Talkaris tenants.",
        "/app",
        "en",
        DEFAULT_PORTAL_SETTINGS,
        DEFAULT_PORTAL_SETTINGS.portalBaseUrl
      )
    );
    await this.session.ensureLoaded();
    if (!this.session.user()) {
      await this.router.navigate(["/login"]);
      return;
    }
    this.tenants = await this.api.listTenants();
    this.selectedTenantId = this.tenants[0]?.id ?? "";
    await this.refreshTenantData();
  }

  async handleTenantChange(): Promise<void> {
    await this.refreshTenantData();
  }

  async refreshTenantData(): Promise<void> {
    if (!this.selectedTenantId) {
      return;
    }

    this.tenantOverview = await this.api.tenantOverview(this.selectedTenantId);
    this.projects = await this.api.tenantProjects(this.selectedTenantId);
    this.sources = await this.api.tenantSources(this.selectedTenantId);
    this.ingestions = await this.api.tenantIngestions(this.selectedTenantId);
    this.documents = await this.api.tenantDocuments(this.selectedTenantId);
    this.leads = await this.api.tenantLeads(this.selectedTenantId);
    this.conversations = await this.api.tenantConversations(this.selectedTenantId);

    if (this.projects.length) {
      this.sourceForm.projectKey ||= this.projects[0].projectKey;
      this.ingestionForm.projectKey ||= this.projects[0].projectKey;
      await this.loadAnalytics(this.projects[0].projectKey);
    } else {
      this.analyticsSummary = null;
    }
  }

  useProject(project: Project): void {
    this.projectForm = {
      projectKey: project.projectKey,
      name: project.name,
      status: project.status ?? "active",
      botName: project.botName,
      allowedDomainsText: project.allowedDomains.join(", "),
      welcomeMessage: project.welcomeMessage,
      ctaPrimaryLabel: project.ctaConfig.primaryLabel,
      ctaPrimaryUrl: project.ctaConfig.primaryUrl,
      launcherLabel: project.widgetTheme.launcherLabel,
      accentColor: project.widgetTheme.accentColor,
      surfaceColor: project.widgetTheme.surfaceColor,
      textColor: project.widgetTheme.textColor,
      promptTone: project.promptPolicy.tone,
    };
  }

  async saveProject(): Promise<void> {
    this.savingProject = true;
    try {
      await this.api.upsertTenantProject(this.selectedTenantId, {
        projectKey: this.projectForm.projectKey,
        name: this.projectForm.name,
        status: this.projectForm.status,
        botName: this.projectForm.botName,
        allowedDomains: this.projectForm.allowedDomainsText
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        welcomeMessage: this.projectForm.welcomeMessage,
        promptPolicy: {
          tone: this.projectForm.promptTone,
        },
        ctaConfig: {
          primaryLabel: this.projectForm.ctaPrimaryLabel,
          primaryUrl: this.projectForm.ctaPrimaryUrl,
        },
        widgetTheme: {
          launcherLabel: this.projectForm.launcherLabel,
          accentColor: this.projectForm.accentColor,
          surfaceColor: this.projectForm.surfaceColor,
          textColor: this.projectForm.textColor,
        },
      });
      await this.refreshTenantData();
    } finally {
      this.savingProject = false;
    }
  }

  async saveSource(): Promise<void> {
    this.savingSource = true;
    try {
      await this.api.upsertSource(this.selectedTenantId, this.sourceForm);
      await this.refreshTenantData();
    } finally {
      this.savingSource = false;
    }
  }

  async queueIngestion(): Promise<void> {
    this.queuingIngestion = true;
    try {
      await this.api.queueIngestion(this.selectedTenantId, this.ingestionForm);
      await this.refreshTenantData();
    } finally {
      this.queuingIngestion = false;
    }
  }

  async loadSnippet(projectKey: string): Promise<void> {
    const snippet = await this.api.projectSnippet(this.selectedTenantId, projectKey);
    this.snippetText = snippet.snippet;
  }

  async loadAnalytics(projectKey: string): Promise<void> {
    this.analyticsSummary = await this.api.tenantAnalytics(this.selectedTenantId, projectKey);
  }

  async inspectConversation(conversation: ConversationItem): Promise<void> {
    this.selectedConversation = conversation;
    this.conversationMessages = await this.api.conversationMessages(this.selectedTenantId, conversation.id);
  }

  async logout(): Promise<void> {
    await this.session.logout();
    window.location.href = "/login";
  }
}
