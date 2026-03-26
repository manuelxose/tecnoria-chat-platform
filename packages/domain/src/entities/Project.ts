export type ProjectStatus = "active" | "draft" | "disabled";

export interface ProjectProps {
  id: string;
  tenantId: string;
  projectKey: string;
  name: string;
  siteKey: string;
  status: ProjectStatus;
  language: string;
  botName: string;
  welcomeMessage: string;
  allowedDomains: string[];
  publicBaseUrl?: string | null;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class Project {
  constructor(private props: ProjectProps) {}

  get id() { return this.props.id; }
  get tenantId() { return this.props.tenantId; }
  get key() { return this.props.projectKey; }
  get name() { return this.props.name; }
  get siteKey() { return this.props.siteKey; }
  get status() { return this.props.status; }
  get language() { return this.props.language; }

  public isAllowedDomain(origin: string): boolean {
    if (!this.props.allowedDomains.length) return true;
    const hostname = new URL(origin).hostname;
    return this.props.allowedDomains.some((domain) => 
      hostname === domain || hostname.endsWith(`.${domain}`)
    );
  }
}
