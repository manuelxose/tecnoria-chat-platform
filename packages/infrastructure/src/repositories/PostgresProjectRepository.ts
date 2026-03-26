import { Pool } from "pg";
import { Project, TenantSecurity } from "@tecnoria-chat/domain";

export class PostgresProjectRepository {
  constructor(private pool: Pool) {}

  public async findByTenant(tenantId: string): Promise<Project[]> {
    // SECURITY HARDENING: Even if tenantId is passed, we verify it matches the current context!
    const contextId = TenantSecurity.currentId();
    if (tenantId !== contextId) throw new Error("SECURITY_ERROR: Access to other tenant projects blocked.");

    const res = await this.pool.query("SELECT * FROM projects WHERE tenant_id = $1", [contextId]);
    return res.rows.map(row => this.toEntity(row));
  }

  private toEntity(row: any): Project {
     return new Project({
       id: row.id,
       tenantId: row.tenant_id,
       projectKey: row.project_key,
       name: row.name,
       siteKey: row.site_key,
       status: row.status,
       language: row.language,
       botName: row.bot_name,
       welcomeMessage: row.welcome_message,
       allowedDomains: row.allowed_domains,
       createdAt: new Date(row.created_at),
       updatedAt: new Date(row.updated_at)
     });
  }
}
