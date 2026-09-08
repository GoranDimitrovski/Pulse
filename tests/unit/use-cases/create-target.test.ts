import { describe, expect, it } from 'vitest';

import { CreateTargetUseCase } from '../../../src/application/use-cases/targets/create-target.use-case.js';
import { ValidationError } from '../../../src/domain/errors/domain-error.js';
import { InMemoryTargetRepository } from '../../fakes/in-memory-target.repository.js';

describe('CreateTargetUseCase', () => {
  it('creates a target with a valid config', async () => {
    const targets = new InMemoryTargetRepository();
    const useCase = new CreateTargetUseCase(targets);

    const target = await useCase.execute({
      tenantId: 'tenant-1',
      name: 'Example',
      type: 'http',
      config: { url: 'https://example.com' },
      intervalSeconds: 60,
      timeoutMs: 5000,
      enabled: true,
    });

    expect(target.id).toBeTruthy();
    expect(targets.targets).toHaveLength(1);
  });

  it('rejects a config invalid for the given type before touching the repository', async () => {
    const targets = new InMemoryTargetRepository();
    const useCase = new CreateTargetUseCase(targets);

    await expect(
      useCase.execute({
        tenantId: 'tenant-1',
        name: 'Bad',
        type: 'tcp',
        config: { host: 'example.com' }, // missing port
        intervalSeconds: 60,
        timeoutMs: 5000,
        enabled: true,
      }),
    ).rejects.toBeInstanceOf(ValidationError);

    expect(targets.targets).toHaveLength(0);
  });
});
