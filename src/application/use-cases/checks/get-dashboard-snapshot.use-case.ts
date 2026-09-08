import type { CheckResult } from '../../../domain/entities/check-result.entity.js';
import type { Target } from '../../../domain/entities/target.entity.js';
import type { ICheckResultRepository } from '../../../domain/repositories/check-result.repository.js';
import type { ITargetRepository } from '../../../domain/repositories/target.repository.js';

export interface DashboardEntry {
  readonly target: Target;
  readonly latestResult: CheckResult | null;
}

export class GetDashboardSnapshotUseCase {
  constructor(
    private readonly targets: ITargetRepository,
    private readonly checkResults: ICheckResultRepository,
  ) {}

  async execute(tenantId: string): Promise<DashboardEntry[]> {
    const [targets, latestResults] = await Promise.all([
      this.targets.listByTenant(tenantId),
      this.checkResults.listLatestByTenant(tenantId),
    ]);

    const resultsByTarget = new Map(latestResults.map((result) => [result.targetId, result]));

    return targets.map((target) => ({
      target,
      latestResult: resultsByTarget.get(target.id) ?? null,
    }));
  }
}
