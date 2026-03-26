import { Tenant } from "@tecnoria-chat/domain";

export interface ITenantRepository {
  findById(id: string): Promise<Tenant | null>;
  findBySlug(slug: string): Promise<Tenant | null>;
  save(tenant: Tenant): Promise<void>;
  list(limit?: number): Promise<Tenant[]>;
}
