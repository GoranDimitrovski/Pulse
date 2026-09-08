import type { CheckOutcome, IHealthChecker } from '../../application/ports/health-checker.port.js';
import type { Target } from '../../domain/entities/target.entity.js';

const DEFAULT_EXPECTED_STATUS_RANGE: readonly [number, number] = [200, 299];

export class HttpChecker implements IHealthChecker {
  readonly type = 'http' as const;

  async check(target: Target): Promise<CheckOutcome> {
    const url = target.config.url;
    if (!url) {
      return { status: 'down', latencyMs: null, message: "Target is missing 'url' config" };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), target.timeoutMs);
    const startedAt = performance.now();

    try {
      const response = await fetch(url, { signal: controller.signal, redirect: 'follow' });
      const latencyMs = Math.round(performance.now() - startedAt);
      const isExpected = this.isExpectedStatus(response.status, target.config.expectedStatusCodes);

      return {
        status: isExpected ? 'up' : 'down',
        latencyMs,
        message: isExpected ? null : `Unexpected status code ${String(response.status)}`,
      };
    } catch (error) {
      return {
        status: 'down',
        latencyMs: null,
        message: this.describeError(error),
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private isExpectedStatus(status: number, expected?: readonly number[]): boolean {
    if (expected && expected.length > 0) {
      return expected.includes(status);
    }
    return status >= DEFAULT_EXPECTED_STATUS_RANGE[0] && status <= DEFAULT_EXPECTED_STATUS_RANGE[1];
  }

  private describeError(error: unknown): string {
    if (error instanceof Error) {
      return error.name === 'AbortError' ? 'Request timed out' : error.message;
    }
    return 'Unknown error';
  }
}
