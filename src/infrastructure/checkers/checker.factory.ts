import type {
  IHealthChecker,
  IHealthCheckerFactory,
} from '../../application/ports/health-checker.port.js';
import type { CheckType } from '../../domain/entities/target.entity.js';

export class HealthCheckerFactory implements IHealthCheckerFactory {
  private readonly checkers: ReadonlyMap<CheckType, IHealthChecker>;

  constructor(checkers: readonly IHealthChecker[]) {
    this.checkers = new Map(checkers.map((checker) => [checker.type, checker]));
  }

  getChecker(type: CheckType): IHealthChecker {
    const checker = this.checkers.get(type);
    if (!checker) {
      throw new Error(`No health checker registered for type '${type}'`);
    }
    return checker;
  }
}
