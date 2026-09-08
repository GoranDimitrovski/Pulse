import { describe, expect, it } from 'vitest';

import { CreateApiKeyUseCase } from '../../../src/application/use-cases/api-keys/create-api-key.use-case.js';
import { FakeTokenService } from '../../fakes/fake-token-service.js';
import { InMemoryApiKeyRepository } from '../../fakes/in-memory-api-key.repository.js';

describe('CreateApiKeyUseCase', () => {
  it('returns the plaintext key once and persists only its hash', async () => {
    const apiKeys = new InMemoryApiKeyRepository();
    const useCase = new CreateApiKeyUseCase(apiKeys, new FakeTokenService());

    const { apiKey, plainTextKey } = await useCase.execute({ tenantId: 'tenant-1', name: 'ci-key' });

    expect(plainTextKey.startsWith('pk_')).toBe(true);
    expect(apiKey.keyPrefix).toBe(plainTextKey.slice(0, 8));
    expect(apiKey.keyHash).not.toBe(plainTextKey);
    expect(apiKeys.keys).toHaveLength(1);
  });

  it('generates a distinct key on every call', async () => {
    const apiKeys = new InMemoryApiKeyRepository();
    const useCase = new CreateApiKeyUseCase(apiKeys, new FakeTokenService());

    const first = await useCase.execute({ tenantId: 'tenant-1', name: 'key-a' });
    const second = await useCase.execute({ tenantId: 'tenant-1', name: 'key-b' });

    expect(first.plainTextKey).not.toBe(second.plainTextKey);
  });
});
