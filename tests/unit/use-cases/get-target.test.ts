import { describe, expect, it } from 'vitest';

import { GetTargetUseCase } from '../../../src/application/use-cases/targets/get-target.use-case.js';
import { NotFoundError } from '../../../src/domain/errors/domain-error.js';
import { InMemoryTargetRepository } from '../../fakes/in-memory-target.repository.js';

describe('GetTargetUseCase', () => {
  it('returns the target when it belongs to the tenant', async () => {
    const targets = new InMemoryTargetRepository();
    const created = await targets.create({
      tenantId: 'tenant-1',
      name: 'Example',
      type: 'http',
      config: { url: 'https://example.com' },
      intervalSeconds: 60,
      timeoutMs: 5000,
      enabled: true,
    });
    const useCase = new GetTargetUseCase(targets);

    const target = await useCase.execute('tenant-1', created.id);
    expect(target.id).toBe(created.id);
  });

  it('throws NotFoundError for a target owned by a different tenant', async () => {
    const targets = new InMemoryTargetRepository();
    const created = await targets.create({
      tenantId: 'tenant-1',
      name: 'Example',
      type: 'http',
      config: { url: 'https://example.com' },
      intervalSeconds: 60,
      timeoutMs: 5000,
      enabled: true,
    });
    const useCase = new GetTargetUseCase(targets);

    await expect(useCase.execute('tenant-2', created.id)).rejects.toBeInstanceOf(NotFoundError);
  });
});
