import type { CheckStatus } from '../../../domain/entities/check-result.entity.js';
import type { Target } from '../../../domain/entities/target.entity.js';
import type { CheckOutcome, IHealthCheckerFactory } from '../../ports/health-checker.port.js';
import type { RecordCheckResultUseCase } from './record-check-result.use-case.js';

/**
 * Runs one target's health check and records the outcome. Owns the rule that a checker
 * blowing up is itself a result — an unreachable target and a checker that threw both mean
 * "this target is down right now", and the dashboard would otherwise show a stale 'up'
 * indefinitely while the failure only ever reached the logs.
 *
 * Rethrows after recording so the caller's circuit breaker still sees the failure: a checker
 * that throws is malfunctioning, which is exactly what the breaker exists to isolate.
 */
export class RunCheckUseCase {
  constructor(
    private readonly checkerFactory: IHealthCheckerFactory,
    private readonly recordCheckResult: RecordCheckResultUseCase,
  ) {}

  async execute(target: Target): Promise<CheckStatus> {
    const checker = this.checkerFactory.getChecker(target.type);

    let outcome: CheckOutcome;
    try {
      outcome = await checker.check(target);
    } catch (error) {
      // Best-effort: the target may have been deleted mid-check, in which case recording
      // the failure fails too (FK violation) and there is nothing left to record for it.
      // The caller logs the original error either way.
      await this.record(target, 'down', null, 'Check failed unexpectedly').catch(() => undefined);
      throw error;
    }

    await this.record(target, outcome.status, outcome.latencyMs, outcome.message);
    return outcome.status;
  }

  private async record(
    target: Target,
    status: CheckStatus,
    latencyMs: number | null,
    message: string | null,
  ): Promise<void> {
    await this.recordCheckResult.execute({
      tenantId: target.tenantId,
      targetId: target.id,
      targetName: target.name,
      status,
      latencyMs,
      message,
    });
  }
}
