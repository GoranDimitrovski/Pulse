import type { Target } from '../../../domain/entities/target.entity.js';
import type { ITargetRepository } from '../../../domain/repositories/target.repository.js';

export class ListTargetsUseCase {
  constructor(private readonly targets: ITargetRepository) {}

  async execute(tenantId: string): Promise<Target[]> {
    return this.targets.listByTenant(tenantId);
  }
}
