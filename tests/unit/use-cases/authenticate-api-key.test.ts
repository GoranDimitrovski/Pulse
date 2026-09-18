import { beforeEach, describe, expect, it } from 'vitest';

import { AuthenticateApiKeyUseCase } from '../../../src/application/use-cases/api-keys/authenticate-api-key.use-case.js';
import { CreateApiKeyUseCase } from '../../../src/application/use-cases/api-keys/create-api-key.use-case.js';
import { KEY_PREFIX_LENGTH } from '../../../src/domain/entities/api-key.entity.js';
import { FakeTokenService } from '../../fakes/fake-token-service.js';
import { InMemoryApiKeyRepository } from '../../fakes/in-memory-api-key.repository.js';

describe('AuthenticateApiKeyUseCase', () => {
  let apiKeys: InMemoryApiKeyRepository;
  let tokenService: FakeTokenService;
  let createUseCase: CreateApiKeyUseCase;
  let useCase: AuthenticateApiKeyUseCase;

  beforeEach(() => {
    apiKeys = new InMemoryApiKeyRepository();
    tokenService = new FakeTokenService();
    createUseCase = new CreateApiKeyUseCase(apiKeys, tokenService);
    useCase = new AuthenticateApiKeyUseCase(apiKeys, tokenService);
  });

  it('authenticates a valid key and records last-used', async () => {
    const { plainTextKey, apiKey } = await createUseCase.execute({
      tenantId: 'tenant-1',
      name: 'ci-key',
    });

    const result = await useCase.execute(plainTextKey);

    expect(result?.id).toBe(apiKey.id);
    expect(apiKeys.keys[0]!.lastUsedAt).not.toBeNull();
  });

  it('rejects an unknown key', async () => {
    expect(await useCase.execute('pk_never-issued')).toBeNull();
  });

  it('rejects a revoked key', async () => {
    const { plainTextKey, apiKey } = await createUseCase.execute({
      tenantId: 'tenant-1',
      name: 'ci-key',
    });
    await apiKeys.revoke('tenant-1', apiKey.id);

    expect(await useCase.execute(plainTextKey)).toBeNull();
  });

  it('rejects a key whose prefix matches but whose secret does not', async () => {
    const { plainTextKey } = await createUseCase.execute({ tenantId: 'tenant-1', name: 'ci-key' });
    const forged =
      plainTextKey.slice(0, KEY_PREFIX_LENGTH) +
      'x'.repeat(plainTextKey.length - KEY_PREFIX_LENGTH);

    expect(await useCase.execute(forged)).toBeNull();
  });
});
