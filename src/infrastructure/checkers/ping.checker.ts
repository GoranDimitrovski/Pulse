import { execFile } from 'node:child_process';
import { platform } from 'node:os';
import { promisify } from 'node:util';

import type { CheckOutcome, IHealthChecker } from '../../application/ports/health-checker.port.js';
import type { Target } from '../../domain/entities/target.entity.js';

const execFileAsync = promisify(execFile);

/**
 * Shells out to the OS `ping` binary rather than crafting raw ICMP sockets, which would
 * require elevated privileges on every target platform. Works unprivileged everywhere.
 */
export class PingChecker implements IHealthChecker {
  readonly type = 'ping' as const;

  async check(target: Target): Promise<CheckOutcome> {
    const host = target.config.host;
    if (!host) {
      return { status: 'down', latencyMs: null, message: "Target is missing 'host' config" };
    }

    const { command, args } = this.buildCommand(host, target.timeoutMs);
    const startedAt = performance.now();

    try {
      const { stdout } = await execFileAsync(command, args, {
        timeout: target.timeoutMs + 1000,
      });
      const latencyMs = this.parseLatencyMs(stdout) ?? Math.round(performance.now() - startedAt);
      return { status: 'up', latencyMs, message: null };
    } catch (error) {
      return { status: 'down', latencyMs: null, message: this.describeError(error) };
    }
  }

  private buildCommand(host: string, timeoutMs: number): { command: string; args: string[] } {
    if (platform() === 'win32') {
      return { command: 'ping', args: ['-n', '1', '-w', String(timeoutMs), host] };
    }
    const timeoutSeconds = Math.max(1, Math.ceil(timeoutMs / 1000));
    return { command: 'ping', args: ['-c', '1', '-W', String(timeoutSeconds), host] };
  }

  private parseLatencyMs(stdout: string): number | null {
    const match = /time[=<]([\d.]+)\s*ms/i.exec(stdout);
    return match?.[1] ? Math.round(parseFloat(match[1])) : null;
  }

  private describeError(error: unknown): string {
    if (error && typeof error === 'object' && 'killed' in error && error.killed) {
      return 'Ping timed out';
    }
    return 'Host unreachable';
  }
}
