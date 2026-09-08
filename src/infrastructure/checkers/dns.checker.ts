import { Resolver } from 'node:dns/promises';

import type { CheckOutcome, IHealthChecker } from '../../application/ports/health-checker.port.js';
import type { Target } from '../../domain/entities/target.entity.js';

export class DnsChecker implements IHealthChecker {
  readonly type = 'dns' as const;

  async check(target: Target): Promise<CheckOutcome> {
    const { host, recordType = 'A' } = target.config;
    if (!host) {
      return { status: 'down', latencyMs: null, message: "Target is missing 'host' config" };
    }

    const resolver = new Resolver();
    resolver.setServers(resolver.getServers());
    const startedAt = performance.now();

    try {
      const records = await this.withTimeout(
        resolver.resolve(host, recordType),
        target.timeoutMs,
      );
      const latencyMs = Math.round(performance.now() - startedAt);
      const hasRecords = Array.isArray(records) ? records.length > 0 : Boolean(records);

      if (!hasRecords) {
        return { status: 'down', latencyMs, message: `No ${recordType} records found` };
      }
      return { status: 'up', latencyMs, message: null };
    } catch (error) {
      return { status: 'down', latencyMs: null, message: this.describeError(error) };
    }
  }

  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('DNS lookup timed out')), timeoutMs);
      promise.then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (error: unknown) => {
          clearTimeout(timer);
          reject(error instanceof Error ? error : new Error(String(error)));
        },
      );
    });
  }

  private describeError(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown DNS error';
  }
}
