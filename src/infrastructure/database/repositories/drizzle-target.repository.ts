import { and, eq } from 'drizzle-orm';

import { Target } from '../../../domain/entities/target.entity.js';
import type {
  CreateTargetInput,
  ITargetRepository,
  UpdateTargetInput,
} from '../../../domain/repositories/target.repository.js';
import type { Database } from '../client.js';
import { targets } from '../schema.js';

export class DrizzleTargetRepository implements ITargetRepository {
  constructor(private readonly db: Database) {}

  async create(input: CreateTargetInput): Promise<Target> {
    const [row] = await this.db.insert(targets).values(input).returning();
    return new Target(row!);
  }

  async findById(tenantId: string, id: string): Promise<Target | null> {
    const [row] = await this.db
      .select()
      .from(targets)
      .where(and(eq(targets.tenantId, tenantId), eq(targets.id, id)))
      .limit(1);
    return row ? new Target(row) : null;
  }

  async listByTenant(tenantId: string): Promise<Target[]> {
    const rows = await this.db.select().from(targets).where(eq(targets.tenantId, tenantId));
    return rows.map((row) => new Target(row));
  }

  async listAllEnabled(): Promise<Target[]> {
    const rows = await this.db.select().from(targets).where(eq(targets.enabled, true));
    return rows.map((row) => new Target(row));
  }

  async update(tenantId: string, id: string, input: UpdateTargetInput): Promise<Target | null> {
    const [row] = await this.db
      .update(targets)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(targets.tenantId, tenantId), eq(targets.id, id)))
      .returning();
    return row ? new Target(row) : null;
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    const result = await this.db
      .delete(targets)
      .where(and(eq(targets.tenantId, tenantId), eq(targets.id, id)))
      .returning({ id: targets.id });
    return result.length > 0;
  }
}
