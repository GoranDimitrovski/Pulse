import { describe, expect, it } from 'vitest';

import { DeleteTargetUseCase } from '../../../src/application/use-cases/targets/delete-target.use-case.js';
import { NotFoundError } from '../../../src/domain/errors/domain-error.js';
import { InMemoryTargetRepository } from '../../fakes/in-memory-target.repository.js';

describe('DeleteTargetUseCase', () => {
  it('deletes an existing target', async () => {
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
    const useCase = new DeleteTargetUseCase(targets);

    await useCase.execute('tenant-1', created.id);
    expect(targets.targets).toHaveLength(0);
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
    const useCase = new DeleteTargetUseCase(targets);

    await expect(useCase.execute('tenant-2', created.id)).rejects.toBeInstanceOf(NotFoundError);
    expect(targets.targets).toHaveLength(1);
  });
});
