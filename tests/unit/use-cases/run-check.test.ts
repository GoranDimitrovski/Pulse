import { beforeEach, describe, expect, it } from 'vitest';

import { RecordCheckResultUseCase } from '../../../src/application/use-cases/checks/record-check-result.use-case.js';
import { RunCheckUseCase } from '../../../src/application/use-cases/checks/run-check.use-case.js';
import type {
  CheckOutcome,
  IHealthChecker,
  IHealthCheckerFactory,
} from '../../../src/application/ports/health-checker.port.js';
import { Target } from '../../../src/domain/entities/target.entity.js';
import { EventBus } from '../../../src/infrastructure/events/event-bus.js';
import { InMemoryCheckResultRepository } from '../../fakes/in-memory-check-result.repository.js';

class StubChecker implements IHealthChecker {
  readonly type = 'http' as const;

  constructor(private readonly behaviour: CheckOutcome | Error) {}

  async check(): Promise<CheckOutcome> {
    if (this.behaviour instanceof Error) {
      throw this.behaviour;
    }
    return this.behaviour;
  }
}

function factoryFor(checker: IHealthChecker): IHealthCheckerFactory {
  return { getChecker: () => checker };
}

const target = new Target({
  id: 'target-1',
  tenantId: 'tenant-1',
  name: 'API',
  type: 'http',
  config: { url: 'https://example.test' },
  intervalSeconds: 60,
  timeoutMs: 5000,
  enabled: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
});

describe('RunCheckUseCase', () => {
  let checkResults: InMemoryCheckResultRepository;
  let recordCheckResult: RecordCheckResultUseCase;

  beforeEach(() => {
    checkResults = new InMemoryCheckResultRepository();
    recordCheckResult = new RecordCheckResultUseCase(checkResults, new EventBus());
  });

  function useCaseFor(behaviour: CheckOutcome | Error): RunCheckUseCase {
    return new RunCheckUseCase(factoryFor(new StubChecker(behaviour)), recordCheckResult);
  }

  it('records the checker outcome and returns its status', async () => {
    const useCase = useCaseFor({ status: 'up', latencyMs: 42, message: null });

    const status = await useCase.execute(target);

    expect(status).toBe('up');
    const [recorded] = checkResults.results;
    expect(recorded?.status).toBe('up');
    expect(recorded?.latencyMs).toBe(42);
    expect(recorded?.tenantId).toBe('tenant-1');
  });

  it('records a down result when the checker throws, then rethrows for the breaker', async () => {
    const useCase = useCaseFor(new Error('socket exploded'));

    await expect(useCase.execute(target)).rejects.toThrow('socket exploded');

    const [recorded] = checkResults.results;
    expect(recorded?.status).toBe('down');
    expect(recorded?.message).toBe('Check failed unexpectedly');
  });

  it('still rethrows the original error when recording the failure also fails', async () => {
    checkResults.failNextCreate = new Error('target was deleted');
    const useCase = useCaseFor(new Error('socket exploded'));

    await expect(useCase.execute(target)).rejects.toThrow('socket exploded');
  });
});
