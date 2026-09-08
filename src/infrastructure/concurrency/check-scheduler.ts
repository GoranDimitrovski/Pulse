import type { RecordCheckResultUseCase } from '../../application/use-cases/checks/record-check-result.use-case.js';
import type { IHealthCheckerFactory } from '../../application/ports/health-checker.port.js';
import type { Target } from '../../domain/entities/target.entity.js';
import type { ITargetRepository } from '../../domain/repositories/target.repository.js';
import type { Logger } from '../logging/logger.js';
import type { Metrics } from '../metrics/metrics.js';
import type { CircuitBreakerRegistry } from './circuit-breaker-registry.js';
import { CircuitOpenError } from './circuit-breaker.js';
import type { WorkerPool } from './worker-pool.js';

const TICK_INTERVAL_MS = 1000;

/**
 * Polls enabled targets across every tenant and dispatches a health check whenever a
 * target's interval has elapsed, bounding concurrency via a WorkerPool and isolating
 * chronically failing targets via a per-target CircuitBreaker.
 */
export class CheckScheduler {
  private readonly nextRunAt = new Map<string, number>();
  private timer: NodeJS.Timeout | null = null;
  private stopped = true;

  constructor(
    private readonly targets: ITargetRepository,
    private readonly checkerFactory: IHealthCheckerFactory,
    private readonly recordCheckResult: RecordCheckResultUseCase,
    private readonly circuitBreakers: CircuitBreakerRegistry,
    private readonly pool: WorkerPool,
    private readonly logger: Logger,
    private readonly metrics: Metrics,
  ) {}

  start(): void {
    this.stopped = false;
    this.timer = setInterval(() => {
      this.tick().catch((error: unknown) => {
        this.logger.error({ error }, 'Scheduler tick failed');
      });
    }, TICK_INTERVAL_MS);
    this.timer.unref();
  }

  stop(): void {
    this.stopped = true;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async tick(): Promise<void> {
    if (this.stopped) return;

    const targets = await this.targets.listAllEnabled();
    const now = Date.now();

    for (const target of targets) {
      const dueAt = this.nextRunAt.get(target.id) ?? 0;
      if (now < dueAt) continue;

      this.nextRunAt.set(target.id, now + target.intervalSeconds * 1000);
      this.pool.run(() => this.runCheck(target)).catch((error: unknown) => {
        this.logger.error({ targetId: target.id, error }, 'Unhandled error running check');
      });
    }
  }

  private async runCheck(target: Target): Promise<void> {
    const breaker = this.circuitBreakers.getFor(target.id);
    const stopTimer = this.metrics.checkDurationSeconds.startTimer({ type: target.type });

    try {
      const outcome = await breaker.execute(() =>
        this.checkerFactory.getChecker(target.type).check(target),
      );
      stopTimer();
      this.metrics.checksTotal.inc({ type: target.type, status: outcome.status });

      await this.recordCheckResult.execute({
        tenantId: target.tenantId,
        targetId: target.id,
        targetName: target.name,
        status: outcome.status,
        latencyMs: outcome.latencyMs,
        message: outcome.message,
      });
    } catch (error) {
      stopTimer();
      const message = error instanceof CircuitOpenError ? 'Circuit breaker open' : 'Check failed unexpectedly';
      this.logger.warn({ targetId: target.id, error }, message);

      if (!(error instanceof CircuitOpenError)) {
        this.metrics.checksTotal.inc({ type: target.type, status: 'down' });
        // Best-effort: the target may have been deleted concurrently, which would make
        // this insert fail too (FK violation) — that's fine, nothing left to record for it.
        await this.recordCheckResult
          .execute({
            tenantId: target.tenantId,
            targetId: target.id,
            targetName: target.name,
            status: 'down',
            latencyMs: null,
            message,
          })
          .catch((recordError: unknown) => {
            this.logger.warn({ targetId: target.id, error: recordError }, 'Failed to record check failure');
          });
      }
    }
  }
}
