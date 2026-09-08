import type { IClock } from '../../application/ports/clock.port.js';

export class SystemClock implements IClock {
  now(): Date {
    return new Date();
  }
}
