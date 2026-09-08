import type { DispatchStatusChangeAlertsUseCase } from '../../application/use-cases/alerts/dispatch-status-change-alerts.use-case.js';
import type { IEventBus, Unsubscribe } from '../../application/ports/event-bus.port.js';
import type { Logger } from '../logging/logger.js';

/** Bridges the domain event bus (Observer) to the alert-dispatch use case. */
export class AlertDispatcher {
  private unsubscribe: Unsubscribe | null = null;

  constructor(
    private readonly eventBus: IEventBus,
    private readonly dispatchAlerts: DispatchStatusChangeAlertsUseCase,
    private readonly logger: Logger,
  ) {}

  start(): void {
    this.unsubscribe = this.eventBus.subscribe('target.status_changed', (event) => {
      this.dispatchAlerts.execute(event).catch((error: unknown) => {
        this.logger.error({ error, targetId: event.targetId }, 'Alert dispatch failed');
      });
    });
  }

  stop(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }
}
