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

    const updated = existing.update(input);
    const persisted = await this.targets.update(tenantId, targetId, {
      name: updated.name,
      config: updated.config,
      intervalSeconds: updated.intervalSeconds,
      timeoutMs: updated.timeoutMs,
      enabled: updated.enabled,
    });
    if (!persisted) {
      throw new NotFoundError('Target', targetId);
    }
    return persisted;
  }
}
