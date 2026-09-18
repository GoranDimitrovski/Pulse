import { EventEmitter } from 'node:events';

import type { DomainEventMap } from '../../domain/events/domain-events.js';
import type { IEventBus, Unsubscribe } from '../../application/ports/event-bus.port.js';

export class EventBus implements IEventBus {
  private readonly emitter = new EventEmitter({ captureRejections: true });

  constructor() {
    this.emitter.setMaxListeners(50);
  }

  publish<K extends keyof DomainEventMap>(type: K, payload: DomainEventMap[K]): void {
    this.emitter.emit(type, payload);
  }

  subscribe<K extends keyof DomainEventMap>(
    type: K,
    handler: (payload: DomainEventMap[K]) => void,
  ): Unsubscribe {
    this.emitter.on(type, handler);
    return () => this.emitter.off(type, handler);
  }
}
