import { and, desc, eq, gte, lt } from 'drizzle-orm';

import { CheckResult } from '../../../domain/entities/check-result.entity.js';
import type {
  CreateCheckResultInput,
  ICheckResultRepository,
} from '../../../domain/repositories/check-result.repository.js';
import type { Database } from '../client.js';
import { checkResults } from '../schema.js';

export class DrizzleCheckResultRepository implements ICheckResultRepository {
  constructor(private readonly db: Database) {}

  async create(input: CreateCheckResultInput): Promise<CheckResult> {
    const [row] = await this.db.insert(checkResults).values(input).returning();
    return new CheckResult(row!);
  }

  async findLatestByTarget(tenantId: string, targetId: string): Promise<CheckResult | null> {
    const [row] = await this.db
      .select()
      .from(checkResults)
      .where(and(eq(checkResults.tenantId, tenantId), eq(checkResults.targetId, targetId)))
      .orderBy(desc(checkResults.checkedAt))
      .limit(1);
    return row ? new CheckResult(row) : null;
  }

  async listLatestByTenant(tenantId: string): Promise<CheckResult[]> {
    const rows = await this.db
      .selectDistinctOn([checkResults.targetId])
      .from(checkResults)
      .where(eq(checkResults.tenantId, tenantId))
      .orderBy(checkResults.targetId, desc(checkResults.checkedAt));
    return rows.map((row) => new CheckResult(row));
  }

  async listHistoryByTarget(
    tenantId: string,
    targetId: string,
    options: { since: Date; limit: number },
  ): Promise<CheckResult[]> {
    const rows = await this.db
      .select()
      .from(checkResults)
      .where(
        and(
          eq(checkResults.tenantId, tenantId),
          eq(checkResults.targetId, targetId),
          gte(checkResults.checkedAt, options.since),
        ),
      )
      .orderBy(desc(checkResults.checkedAt))
      .limit(options.limit);
    return rows.map((row) => new CheckResult(row));
  }

  async pruneOlderThan(cutoff: Date): Promise<number> {
    const result = await this.db
      .delete(checkResults)
      .where(lt(checkResults.checkedAt, cutoff))
      .returning({ id: checkResults.id });
    return result.length;
  }
}
