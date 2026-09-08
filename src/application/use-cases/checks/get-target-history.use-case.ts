import { NotFoundError } from '../../../domain/errors/domain-error.js';
import type { CheckResult } from '../../../domain/entities/check-result.entity.js';
import type { ICheckResultRepository } from '../../../domain/repositories/check-result.repository.js';
import type { ITargetRepository } from '../../../domain/repositories/target.repository.js';

export interface GetTargetHistoryInput {
  readonly tenantId: string;
  readonly targetId: string;
  readonly since: Date;
  readonly limit: number;
}

export class GetTargetHistoryUseCase {
  constructor(
    private readonly targets: ITargetRepository,
    private readonly checkResults: ICheckResultRepository,
  ) {}

  async execute(input: GetTargetHistoryInput): Promise<CheckResult[]> {
    const target = await this.targets.findById(input.tenantId, input.targetId);
    if (!target) {
      throw new NotFoundError('Target', input.targetId);
    }

    return this.checkResults.listHistoryByTarget(input.tenantId, input.targetId, {
      since: input.since,
      limit: input.limit,
    });
  }
}
