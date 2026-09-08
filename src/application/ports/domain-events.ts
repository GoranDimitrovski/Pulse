import type { CheckResult, CheckStatus } from '../../domain/entities/check-result.entity.js';

export interface CheckCompletedEvent {
  readonly tenantId: string;
  readonly targetId: string;
  readonly targetName: string;
  readonly result: CheckResult;
}

export interface TargetStatusChangedEvent {
  readonly tenantId: string;
  readonly targetId: string;
  readonly targetName: string;
  readonly previousStatus: CheckStatus | null;
  readonly currentStatus: CheckStatus;
  readonly result: CheckResult;
}

export interface DomainEventMap {
  'check.completed': CheckCompletedEvent;
  'target.status_changed': TargetStatusChangedEvent;
}
