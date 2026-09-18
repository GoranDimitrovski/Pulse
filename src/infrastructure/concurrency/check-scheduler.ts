import type { RunCheckUseCase } from '../../application/use-cases/checks/run-check.use-case.js';
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
    private readonly runCheck: RunCheckUseCase,
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
      this.pool
        .run(() => this.dispatch(target))
        .catch((error: unknown) => {
          this.logger.error({ targetId: target.id, error }, 'Unhandled error running check');
        });
    }
  }

  /** Breaker + metrics + logging around one RunCheckUseCase call. Recording the result is its job, not ours. */
  private async dispatch(target: Target): Promise<void> {
    const breaker = this.circuitBreakers.getFor(target.id);
    const stopTimer = this.metrics.checkDurationSeconds.startTimer({ type: target.type });

    try {
      const status = await breaker.execute(() => this.runCheck.execute(target));
      this.metrics.checksTotal.inc({ type: target.type, status });
    } catch (error) {
      const open = error instanceof CircuitOpenError;
      this.logger.warn(
        { targetId: target.id, error },
        open ? 'Circuit breaker open' : 'Check failed unexpectedly',
      );
      // An open circuit means nothing ran, so there is no outcome to count.
      if (!open) {
        this.metrics.checksTotal.inc({ type: target.type, status: 'down' });
      }
    } finally {
      stopTimer();
    }
  }
}
