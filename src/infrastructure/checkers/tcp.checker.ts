import { Socket } from 'node:net';

import type { CheckOutcome, IHealthChecker } from '../../application/ports/health-checker.port.js';
import type { Target } from '../../domain/entities/target.entity.js';

export class TcpChecker implements IHealthChecker {
  readonly type = 'tcp' as const;

  async check(target: Target): Promise<CheckOutcome> {
    const { host, port } = target.config;
    if (!host || !port) {
      return {
        status: 'down',
        latencyMs: null,
        message: "Target is missing 'host' or 'port' config",
      };
    }

    const startedAt = performance.now();

    return new Promise<CheckOutcome>((resolve) => {
      const socket = new Socket();
      const finish = (outcome: CheckOutcome): void => {
        socket.destroy();
        resolve(outcome);
      };

      socket.setTimeout(target.timeoutMs);
      socket.once('connect', () => {
        finish({
          status: 'up',
          latencyMs: Math.round(performance.now() - startedAt),
          message: null,
        });
      });
      socket.once('timeout', () => {
        finish({ status: 'down', latencyMs: null, message: 'Connection timed out' });
      });
      socket.once('error', (error) => {
        finish({ status: 'down', latencyMs: null, message: error.message });
      });

      socket.connect(port, host);
    });
  }
}
