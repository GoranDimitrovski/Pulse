import { describe, expect, it } from 'vitest';

import { UpdateTargetUseCase } from '../../../src/application/use-cases/targets/update-target.use-case.js';
import { NotFoundError, ValidationError } from '../../../src/domain/errors/domain-error.js';
import { InMemoryTargetRepository } from '../../fakes/in-memory-target.repository.js';

async function createHttpTarget(targets: InMemoryTargetRepository) {
  return targets.create({
    tenantId: 'tenant-1',
    name: 'Example',
    type: 'http',
    config: { url: 'https://example.com' },
    intervalSeconds: 60,
    timeoutMs: 5000,
    enabled: true,
  });
}

describe('UpdateTargetUseCase', () => {
  it('updates fields that do not touch config without requiring one', async () => {
    const targets = new InMemoryTargetRepository();
    const created = await createHttpTarget(targets);
    const useCase = new UpdateTargetUseCase(targets);

    const updated = await useCase.execute('tenant-1', created.id, { enabled: false });
    expect(updated.enabled).toBe(false);
  });

  it('validates a new config against the existing (unchangeable) type', async () => {
    const targets = new InMemoryTargetRepository();
    const created = await createHttpTarget(targets);
    const useCase = new UpdateTargetUseCase(targets);

    // 'host' alone is invalid for an http-type target, which still requires 'url'
    await expect(
      useCase.execute('tenant-1', created.id, { config: { host: 'example.com' } }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('accepts a valid config update', async () => {
    const targets = new InMemoryTargetRepository();
    const created = await createHttpTarget(targets);
    const useCase = new UpdateTargetUseCase(targets);

    const updated = await useCase.execute('tenant-1', created.id, {
      config: { url: 'https://other.example.com' },
    });
    expect(updated.config.url).toBe('https://other.example.com');
  });

  it('throws NotFoundError for a target that does not exist', async () => {
    const useCase = new UpdateTargetUseCase(new InMemoryTargetRepository());
    await expect(useCase.execute('tenant-1', 'missing-id', { enabled: false })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
