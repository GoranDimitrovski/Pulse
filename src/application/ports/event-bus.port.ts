import type { DomainEventMap } from './domain-events.js';

export type Unsubscribe = () => void;

/** Observer / Pub-Sub port: decouples publishers (scheduler) from subscribers (WS gateway, alerters). */
export interface IEventBus {
  publish<K extends keyof DomainEventMap>(type: K, payload: DomainEventMap[K]): void;
  subscribe<K extends keyof DomainEventMap>(
    type: K,
    handler: (payload: DomainEventMap[K]) => void,
  ): Unsubscribe;
}
