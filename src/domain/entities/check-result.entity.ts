export const CHECK_STATUSES = ['up', 'down', 'degraded'] as const;
export type CheckStatus = (typeof CHECK_STATUSES)[number];

export interface CheckResultProps {
  readonly id: string;
  readonly tenantId: string;
  readonly targetId: string;
  readonly status: CheckStatus;
  readonly latencyMs: number | null;
  readonly message: string | null;
  readonly checkedAt: Date;
}

export class CheckResult {
  readonly id: string;
  readonly tenantId: string;
  readonly targetId: string;
  readonly status: CheckStatus;
  readonly latencyMs: number | null;
  readonly message: string | null;
  readonly checkedAt: Date;

  constructor(props: CheckResultProps) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.targetId = props.targetId;
    this.status = props.status;
    this.latencyMs = props.latencyMs;
    this.message = props.message;
    this.checkedAt = props.checkedAt;
  }

  /** True on a genuine up/down/degraded transition — a `null` previous counts as a change. */
  hasStatusChangeFrom(previous: CheckResult | null): boolean {
    return previous?.status !== this.status;
  }
}
