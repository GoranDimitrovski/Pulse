import { beforeEach, describe, expect, it } from 'vitest';

import { RecordCheckResultUseCase } from '../../../src/application/use-cases/checks/record-check-result.use-case.js';
import { EventBus } from '../../../src/infrastructure/events/event-bus.js';
import { InMemoryCheckResultRepository } from '../../fakes/in-memory-check-result.repository.js';

describe('RecordCheckResultUseCase', () => {
  let checkResults: InMemoryCheckResultRepository;
  let eventBus: EventBus;
  let useCase: RecordCheckResultUseCase;

  beforeEach(() => {
    checkResults = new InMemoryCheckResultRepository();
    eventBus = new EventBus();
    useCase = new RecordCheckResultUseCase(checkResults, eventBus);
  });

  it('always publishes check.completed', async () => {
    const completed: unknown[] = [];
    eventBus.subscribe('check.completed', (event) => completed.push(event));

    await useCase.execute({
      tenantId: 't1',
      targetId: 'target1',
      targetName: 'API',
      status: 'up',
      latencyMs: 10,
      message: null,
    });

    expect(completed).toHaveLength(1);
  });

  it('publishes target.status_changed only on a transition', async () => {
    const statusChanges: unknown[] = [];
    eventBus.subscribe('target.status_changed', (event) => statusChanges.push(event));

    const input = {
      tenantId: 't1',
      targetId: 'target1',
      targetName: 'API',
      latencyMs: 10,
      message: null,
    } as const;

    await useCase.execute({ ...input, status: 'up' });
    expect(statusChanges).toHaveLength(1); // null -> up is a transition

    await useCase.execute({ ...input, status: 'up' });
    expect(statusChanges).toHaveLength(1); // up -> up is not

    await useCase.execute({ ...input, status: 'down' });
    expect(statusChanges).toHaveLength(2); // up -> down is
  });
});
