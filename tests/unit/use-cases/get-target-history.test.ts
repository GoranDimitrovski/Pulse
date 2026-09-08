import { describe, expect, it } from 'vitest';

import { GetTargetHistoryUseCase } from '../../../src/application/use-cases/checks/get-target-history.use-case.js';
import { NotFoundError } from '../../../src/domain/errors/domain-error.js';
import { InMemoryCheckResultRepository } from '../../fakes/in-memory-check-result.repository.js';
import { InMemoryTargetRepository } from '../../fakes/in-memory-target.repository.js';

describe('GetTargetHistoryUseCase', () => {
  it('returns history scoped to the target and time window', async () => {
    const targets = new InMemoryTargetRepository();
    const checkResults = new InMemoryCheckResultRepository();
    const target = await targets.create({
      tenantId: 'tenant-1',
      name: 'Example',
      type: 'http',
      config: { url: 'https://example.com' },
      intervalSeconds: 60,
      timeoutMs: 5000,
      enabled: true,
    });
    await checkResults.create({
      tenantId: 'tenant-1',
      targetId: target.id,
      status: 'up',
      latencyMs: 12,
      message: null,
    });
    const useCase = new GetTargetHistoryUseCase(targets, checkResults);

    const history = await useCase.execute({
      tenantId: 'tenant-1',
      targetId: target.id,
      since: new Date(Date.now() - 60_000),
      limit: 10,
    });

    expect(history).toHaveLength(1);
  });

  it('throws NotFoundError when the target does not belong to the tenant', async () => {
    const targets = new InMemoryTargetRepository();
    const checkResults = new InMemoryCheckResultRepository();
    const useCase = new GetTargetHistoryUseCase(targets, checkResults);

    await expect(
      useCase.execute({ tenantId: 'tenant-1', targetId: 'missing-id', since: new Date(0), limit: 10 }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
