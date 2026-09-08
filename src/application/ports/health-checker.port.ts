import type { CheckStatus } from '../../domain/entities/check-result.entity.js';
import type { CheckType, Target } from '../../domain/entities/target.entity.js';

export interface CheckOutcome {
  readonly status: CheckStatus;
  readonly latencyMs: number | null;
  readonly message: string | null;
}

/** Strategy interface: one implementation per CheckType (ping/http/tcp/dns). */
export interface IHealthChecker {
  readonly type: CheckType;
  check(target: Target): Promise<CheckOutcome>;
}

/** Factory: resolves the correct strategy for a target's check type. */
export interface IHealthCheckerFactory {
  getChecker(type: CheckType): IHealthChecker;
}
