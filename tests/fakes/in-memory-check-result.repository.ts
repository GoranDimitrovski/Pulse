import { randomUUID } from 'node:crypto';

import { CheckResult } from '../../src/domain/entities/check-result.entity.js';
import type {
  CreateCheckResultInput,
  ICheckResultRepository,
} from '../../src/domain/repositories/check-result.repository.js';

export class InMemoryCheckResultRepository implements ICheckResultRepository {
  readonly results: CheckResult[] = [];
  /** Set to simulate the insert failing, e.g. the FK violation when a target is deleted mid-check. */
  failNextCreate: Error | null = null;

  async create(input: CreateCheckResultInput): Promise<CheckResult> {
    if (this.failNextCreate) {
      const error = this.failNextCreate;
      this.failNextCreate = null;
      throw error;
    }
    const result = new CheckResult({ id: randomUUID(), checkedAt: new Date(), ...input });
    this.results.push(result);
    return result;
  }

  async findLatestByTarget(tenantId: string, targetId: string): Promise<CheckResult | null> {
    return (
      this.results
        .filter((r) => r.tenantId === tenantId && r.targetId === targetId)
        .sort((a, b) => b.checkedAt.getTime() - a.checkedAt.getTime())[0] ?? null
    );
  }

  async listLatestByTenant(tenantId: string): Promise<CheckResult[]> {
    const byTarget = new Map<string, CheckResult>();
    for (const result of this.results.filter((r) => r.tenantId === tenantId)) {
      const existing = byTarget.get(result.targetId);
      if (!existing || result.checkedAt > existing.checkedAt) {
        byTarget.set(result.targetId, result);
      }
    }
    return [...byTarget.values()];
  }

  async listHistoryByTarget(
    tenantId: string,
    targetId: string,
    options: { since: Date; limit: number },
  ): Promise<CheckResult[]> {
    return this.results
      .filter(
        (r) => r.tenantId === tenantId && r.targetId === targetId && r.checkedAt >= options.since,
      )
      .sort((a, b) => b.checkedAt.getTime() - a.checkedAt.getTime())
      .slice(0, options.limit);
  }
}
