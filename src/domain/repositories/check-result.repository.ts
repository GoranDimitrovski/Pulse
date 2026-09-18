import type { CheckResult, CheckStatus } from '../entities/check-result.entity.js';

export interface CreateCheckResultInput {
  readonly tenantId: string;
  readonly targetId: string;
  readonly status: CheckStatus;
  readonly latencyMs: number | null;
  readonly message: string | null;
}

export interface ICheckResultRepository {
  create(input: CreateCheckResultInput): Promise<CheckResult>;
  findLatestByTarget(tenantId: string, targetId: string): Promise<CheckResult | null>;
  listLatestByTenant(tenantId: string): Promise<CheckResult[]>;
  listHistoryByTarget(
    tenantId: string,
    targetId: string,
    options: { since: Date; limit: number },
  ): Promise<CheckResult[]>;
}
