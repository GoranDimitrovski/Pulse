import { ValidationError } from '../errors/domain-error.js';

export const CHECK_TYPES = ['ping', 'http', 'tcp', 'dns'] as const;
export type CheckType = (typeof CHECK_TYPES)[number];

export interface TargetConfig {
  /** HTTP(S) URL for 'http' checks. */
  readonly url?: string;
  /** Hostname or IP for 'ping' | 'tcp' | 'dns' checks. */
  readonly host?: string;
  /** Port for 'tcp' checks. */
  readonly port?: number;
  /** Expected DNS record type for 'dns' checks, e.g. 'A'. */
  readonly recordType?: string;
  /** Expected HTTP status codes, defaults to [200-299]. */
  readonly expectedStatusCodes?: readonly number[];
}

export interface TargetProps {
  readonly id: string;
  readonly tenantId: string;
  readonly name: string;
  readonly type: CheckType;
  readonly config: TargetConfig;
  readonly intervalSeconds: number;
  readonly timeoutMs: number;
  readonly enabled: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface TargetUpdateInput {
  readonly name?: string;
  readonly type?: CheckType;
  readonly config?: TargetConfig;
  readonly intervalSeconds?: number;
  readonly timeoutMs?: number;
  readonly enabled?: boolean;
}

export class Target {
  readonly id: string;
  readonly tenantId: string;
  readonly name: string;
  readonly type: CheckType;
  readonly config: TargetConfig;
  readonly intervalSeconds: number;
  readonly timeoutMs: number;
  readonly enabled: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: TargetProps) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.name = props.name;
    this.type = props.type;
    this.config = props.config;
    this.intervalSeconds = props.intervalSeconds;
    this.timeoutMs = props.timeoutMs;
    this.enabled = props.enabled;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * A target's config is only valid relative to its own check type (an 'http' target
   * needs a url, a 'tcp' target needs a host+port, ...) — that pairing is this entity's
   * core invariant, so it owns the rule rather than leaving it to whichever use case
   * happens to be creating or updating a target.
   */
  static validateConfig(type: CheckType, config: TargetConfig): void {
    switch (type) {
      case 'http':
        if (!config.url) {
          throw new ValidationError("HTTP targets require a 'url'");
        }
        return;
      case 'ping':
        if (!config.host) {
          throw new ValidationError("Ping targets require a 'host'");
        }
        return;
      case 'tcp':
        if (!config.host || !config.port) {
          throw new ValidationError("TCP targets require 'host' and 'port'");
        }
        return;
      case 'dns':
        if (!config.host) {
          throw new ValidationError("DNS targets require a 'host'");
        }
        return;
    }
  }

  update(input: TargetUpdateInput): Target {
    const nextType = input.type ?? this.type;
    const nextConfig = input.config ?? this.config;

    Target.validateConfig(nextType, nextConfig);

    return new Target({
      ...this,
      name: input.name ?? this.name,
      type: nextType,
      config: nextConfig,
      intervalSeconds: input.intervalSeconds ?? this.intervalSeconds,
      timeoutMs: input.timeoutMs ?? this.timeoutMs,
      enabled: input.enabled ?? this.enabled,
      updatedAt: new Date(),
    });
  }
}
