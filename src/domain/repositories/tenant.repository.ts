import type { Tenant } from '../entities/tenant.entity.js';

export interface CreateTenantInput {
  readonly name: string;
  readonly slug: string;
}

export interface ITenantRepository {
  create(input: CreateTenantInput): Promise<Tenant>;
  findById(id: string): Promise<Tenant | null>;
  findBySlug(slug: string): Promise<Tenant | null>;
}
