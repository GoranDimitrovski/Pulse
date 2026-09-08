import { NotFoundError } from '../../../domain/errors/domain-error.js';
import type { Target } from '../../../domain/entities/target.entity.js';
import type { ITargetRepository } from '../../../domain/repositories/target.repository.js';

export class GetTargetUseCase {
  constructor(private readonly targets: ITargetRepository) {}

  async execute(tenantId: string, targetId: string): Promise<Target> {
    const target = await this.targets.findById(tenantId, targetId);
    if (!target) {
      throw new NotFoundError('Target', targetId);
    }
    return target;
  }
}
