import { randomUUID } from 'node:crypto';

import { Tenant } from '../../src/domain/entities/tenant.entity.js';
import type {
  CreateTenantInput,
  ITenantRepository,
} from '../../src/domain/repositories/tenant.repository.js';

export class InMemoryTenantRepository implements ITenantRepository {
  readonly tenants: Tenant[] = [];

  async create(input: CreateTenantInput): Promise<Tenant> {
    const tenant = new Tenant({ id: randomUUID(), createdAt: new Date(), ...input });
    this.tenants.push(tenant);
    return tenant;
  }

  async findById(id: string): Promise<Tenant | null> {
    return this.tenants.find((t) => t.id === id) ?? null;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    return this.tenants.find((t) => t.slug === slug) ?? null;
  }
}
