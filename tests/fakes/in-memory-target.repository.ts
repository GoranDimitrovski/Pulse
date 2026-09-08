import { randomUUID } from 'node:crypto';

import { Target } from '../../src/domain/entities/target.entity.js';
import type {
  CreateTargetInput,
  ITargetRepository,
  UpdateTargetInput,
} from '../../src/domain/repositories/target.repository.js';

export class InMemoryTargetRepository implements ITargetRepository {
  readonly targets: Target[] = [];

  async create(input: CreateTargetInput): Promise<Target> {
    const now = new Date();
    const target = new Target({ id: randomUUID(), createdAt: now, updatedAt: now, ...input });
    this.targets.push(target);
    return target;
  }

  async findById(tenantId: string, id: string): Promise<Target | null> {
    return this.targets.find((t) => t.tenantId === tenantId && t.id === id) ?? null;
  }

  async listByTenant(tenantId: string): Promise<Target[]> {
    return this.targets.filter((t) => t.tenantId === tenantId);
  }

  async listAllEnabled(): Promise<Target[]> {
    return this.targets.filter((t) => t.enabled);
  }

  async update(tenantId: string, id: string, input: UpdateTargetInput): Promise<Target | null> {
    const index = this.targets.findIndex((t) => t.tenantId === tenantId && t.id === id);
    if (index === -1) return null;
    this.targets[index] = new Target({ ...this.targets[index]!, ...input, updatedAt: new Date() });
    return this.targets[index];
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    const index = this.targets.findIndex((t) => t.tenantId === tenantId && t.id === id);
    if (index === -1) return false;
    this.targets.splice(index, 1);
    return true;
  }
}
