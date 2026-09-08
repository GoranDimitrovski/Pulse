import { NotFoundError } from '../../../domain/errors/domain-error.js';
import type { ITargetRepository } from '../../../domain/repositories/target.repository.js';

export class DeleteTargetUseCase {
  constructor(private readonly targets: ITargetRepository) {}

  async execute(tenantId: string, targetId: string): Promise<void> {
    const deleted = await this.targets.delete(tenantId, targetId);
    if (!deleted) {
      throw new NotFoundError('Target', targetId);
    }
  }
}
