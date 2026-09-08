import { randomUUID } from 'node:crypto';

import { CheckResult } from '../../src/domain/entities/check-result.entity.js';
import type {
  CreateCheckResultInput,
  ICheckResultRepository,
} from '../../src/domain/repositories/check-result.repository.js';

export class InMemoryCheckResultRepository implements ICheckResultRepository {
  readonly results: CheckResult[] = [];

  async create(input: CreateCheckResultInput): Promise<CheckResult> {
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

  async pruneOlderThan(cutoff: Date): Promise<number> {
    const before = this.results.length;
    const kept = this.results.filter((r) => r.checkedAt >= cutoff);
    this.results.length = 0;
    this.results.push(...kept);
    return before - kept.length;
  }
}
