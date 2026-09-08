import { NotFoundError } from '../../../domain/errors/domain-error.js';
import { Target } from '../../../domain/entities/target.entity.js';
import type {
  ITargetRepository,
  UpdateTargetInput,
} from '../../../domain/repositories/target.repository.js';

export class UpdateTargetUseCase {
  constructor(private readonly targets: ITargetRepository) {}

  async execute(tenantId: string, targetId: string, input: UpdateTargetInput): Promise<Target> {
    const existing = await this.targets.findById(tenantId, targetId);
    if (!existing) {
      throw new NotFoundError('Target', targetId);
    }

    if (input.config) {
      Target.validateConfig(existing.type, input.config);
    }

    const updated = await this.targets.update(tenantId, targetId, input);
    if (!updated) {
      throw new NotFoundError('Target', targetId);
    }
    return updated;
  }
}
