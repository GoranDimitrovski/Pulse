import type { CheckStatus } from '../../../domain/entities/check-result.entity.js';
import type { ICheckResultRepository } from '../../../domain/repositories/check-result.repository.js';
import type { IEventBus } from '../../ports/event-bus.port.js';

export interface RecordCheckResultInput {
  readonly tenantId: string;
  readonly targetId: string;
  readonly targetName: string;
  readonly status: CheckStatus;
  readonly latencyMs: number | null;
  readonly message: string | null;
}

/**
 * Persists a check outcome and publishes domain events for it (Observer pattern):
 * always 'check.completed' (drives the live dashboard), and additionally
 * 'target.status_changed' only on a transition (drives alerting, avoiding alert spam
 * on every successful re-check of an already-up target).
 */
export class RecordCheckResultUseCase {
  constructor(
    private readonly checkResults: ICheckResultRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: RecordCheckResultInput): Promise<void> {
    const previous = await this.checkResults.findLatestByTarget(input.tenantId, input.targetId);

    const result = await this.checkResults.create({
      tenantId: input.tenantId,
      targetId: input.targetId,
      status: input.status,
      latencyMs: input.latencyMs,
      message: input.message,
    });

    this.eventBus.publish('check.completed', {
      tenantId: input.tenantId,
      targetId: input.targetId,
      targetName: input.targetName,
      result,
    });

    if (result.hasStatusChangeFrom(previous)) {
      this.eventBus.publish('target.status_changed', {
        tenantId: input.tenantId,
        targetId: input.targetId,
        targetName: input.targetName,
        previousStatus: previous?.status ?? null,
        currentStatus: input.status,
        result,
      });
    }
  }
}
