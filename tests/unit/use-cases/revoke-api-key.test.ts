import { describe, expect, it } from 'vitest';

import { RevokeApiKeyUseCase } from '../../../src/application/use-cases/api-keys/revoke-api-key.use-case.js';
import { NotFoundError } from '../../../src/domain/errors/domain-error.js';
import { InMemoryApiKeyRepository } from '../../fakes/in-memory-api-key.repository.js';

describe('RevokeApiKeyUseCase', () => {
  it('revokes an existing key', async () => {
    const apiKeys = new InMemoryApiKeyRepository();
    const key = await apiKeys.create({
      tenantId: 'tenant-1',
      name: 'ci-key',
      keyHash: 'hash',
      keyPrefix: 'pk_abcd',
    });
    const useCase = new RevokeApiKeyUseCase(apiKeys);

    await useCase.execute('tenant-1', key.id);

    expect(apiKeys.keys[0]!.revokedAt).not.toBeNull();
  });

  it('throws NotFoundError for a key that does not exist', async () => {
    const useCase = new RevokeApiKeyUseCase(new InMemoryApiKeyRepository());
    await expect(useCase.execute('tenant-1', 'missing-id')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws NotFoundError when the key belongs to a different tenant', async () => {
    const apiKeys = new InMemoryApiKeyRepository();
    const key = await apiKeys.create({
      tenantId: 'tenant-1',
      name: 'ci-key',
      keyHash: 'hash',
      keyPrefix: 'pk_abcd',
    });
    const useCase = new RevokeApiKeyUseCase(apiKeys);

    await expect(useCase.execute('tenant-2', key.id)).rejects.toBeInstanceOf(NotFoundError);
  });
});
