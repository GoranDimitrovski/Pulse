import type { IEventBus, Unsubscribe } from '../../application/ports/event-bus.port.js';
import type { ConnectionManager } from './connection-manager.js';

/** Bridges 'check.completed' domain events (Observer) onto tenant-scoped WebSocket broadcasts. */
export class DashboardGateway {
  private unsubscribe: Unsubscribe | null = null;

  constructor(
    private readonly eventBus: IEventBus,
    private readonly connections: ConnectionManager,
  ) {}

  start(): void {
    this.unsubscribe = this.eventBus.subscribe('check.completed', (event) => {
      this.connections.broadcast(event.tenantId, {
        type: 'check.completed',
        targetId: event.targetId,
        targetName: event.targetName,
        result: event.result,
      });
    });
  }

  stop(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }
}
