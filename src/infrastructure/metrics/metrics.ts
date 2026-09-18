import { Counter, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

export class Metrics {
  readonly registry = new Registry();

  readonly checksTotal = new Counter({
    name: 'pulse_checks_total',
    help: 'Total number of health checks executed',
    labelNames: ['type', 'status'] as const,
    registers: [this.registry],
  });

  readonly checkDurationSeconds = new Histogram({
    name: 'pulse_check_duration_seconds',
    help: 'Health check duration in seconds',
    labelNames: ['type'] as const,
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [this.registry],
  });

  constructor() {
    collectDefaultMetrics({ register: this.registry, prefix: 'pulse_' });
  }
}
