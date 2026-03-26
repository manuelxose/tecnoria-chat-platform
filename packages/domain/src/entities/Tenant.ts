export type TenantStatus = "active" | "pending" | "disabled";

export interface TenantProps {
  id: string;
  slug: string;
  name: string;
  status: TenantStatus;
  brandName?: string | null;
  publicBaseUrl?: string | null;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class Tenant {
  constructor(private props: TenantProps) {}

  get id() { return this.props.id; }
  get slug() { return this.props.slug; }
  get name() { return this.props.name; }
  get status() { return this.props.status; }
  get metadata() { return this.props.metadata ?? {}; }

  public isActive(): boolean {
    return this.props.status === "active";
  }

  public updateMetadata(key: string, value: any): void {
    this.props.metadata = { ...this.props.metadata, [key]: value };
    this.props.updatedAt = new Date();
  }
}
