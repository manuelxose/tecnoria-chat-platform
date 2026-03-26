import { Pool } from "pg";
import { Tenant } from "@tecnoria-chat/domain";
import { ITenantRepository } from "@tecnoria-chat/application";

export class PostgresTenantRepository implements ITenantRepository {
  constructor(private pool: Pool) {}

  public async findById(id: string): Promise<Tenant | null> {
    const res = await this.pool.query("SELECT * FROM tenants WHERE id = $1 LIMIT 1", [id]);
    return res.rowCount ? this.toEntity(res.rows[0]) : null;
  }

  public async findBySlug(slug: string): Promise<Tenant | null> {
    const res = await this.pool.query("SELECT * FROM tenants WHERE slug = $1 LIMIT 1", [slug]);
    return res.rowCount ? this.toEntity(res.rows[0]) : null;
  }

  public async save(tenant: Tenant): Promise<void> {
    await this.pool.query(
      `INSERT INTO tenants (id, slug, name, status, brand_name, public_base_url, metadata, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, NOW())
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         status = EXCLUDED.status,
         metadata = EXCLUDED.metadata,
         updated_at = NOW()`,
      [tenant.id, tenant.slug, tenant.name, tenant.status, tenant.metadata.brandName, tenant.metadata.publicBaseUrl, JSON.stringify(tenant.metadata)]
    );
  }

  public async list(limit: number = 50): Promise<Tenant[]> {
    const res = await this.pool.query("SELECT * FROM tenants ORDER BY created_at DESC LIMIT $1", [limit]);
    return res.rows.map(row => this.toEntity(row));
  }

  private toEntity(row: any): Tenant {
    return new Tenant({
      id: row.id,
      slug: row.slug,
      name: row.name,
      status: row.status,
      brandName: row.brand_name,
      publicBaseUrl: row.public_base_url,
      metadata: row.metadata,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    });
  }
}
