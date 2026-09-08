import { CircuitBreaker, type CircuitBreakerOptions } from './circuit-breaker.js';

/** Lazily creates and caches one CircuitBreaker per target id. */
export class CircuitBreakerRegistry {
  private readonly breakers = new Map<string, CircuitBreaker>();

  constructor(private readonly options: CircuitBreakerOptions) {}

  getFor(targetId: string): CircuitBreaker {
    let breaker = this.breakers.get(targetId);
    if (!breaker) {
      breaker = new CircuitBreaker(this.options);
      this.breakers.set(targetId, breaker);
    }
    return breaker;
  }

  remove(targetId: string): void {
    this.breakers.delete(targetId);
  }
}
