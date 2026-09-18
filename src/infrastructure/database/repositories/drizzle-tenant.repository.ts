import { eq } from 'drizzle-orm';

import { Tenant } from '../../../domain/entities/tenant.entity.js';
import type {
  CreateTenantInput,
  ITenantRepository,
} from '../../../domain/repositories/tenant.repository.js';
import type { Database } from '../client.js';
import { tenants } from '../schema.js';

export class DrizzleTenantRepository implements ITenantRepository {
  constructor(private readonly db: Database) {}

  async create(input: CreateTenantInput): Promise<Tenant> {
    const [row] = await this.db.insert(tenants).values(input).returning();
    return new Tenant(row!);
  }

  async findById(id: string): Promise<Tenant | null> {
    const [row] = await this.db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
    return row ? new Tenant(row) : null;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const [row] = await this.db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
    return row ? new Tenant(row) : null;
  }
}
