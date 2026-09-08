import { beforeEach, describe, expect, it } from 'vitest';

import { LogoutUseCase } from '../../../src/application/use-cases/auth/logout.use-case.js';
import { FakeTokenService } from '../../fakes/fake-token-service.js';
import { InMemoryRefreshTokenRepository } from '../../fakes/in-memory-refresh-token.repository.js';

describe('LogoutUseCase', () => {
  let refreshTokens: InMemoryRefreshTokenRepository;
  let tokenService: FakeTokenService;
  let useCase: LogoutUseCase;

  beforeEach(() => {
    refreshTokens = new InMemoryRefreshTokenRepository();
    tokenService = new FakeTokenService();
    useCase = new LogoutUseCase(refreshTokens, tokenService);
  });

  it('revokes the matching refresh token', async () => {
    const plainToken = tokenService.generateOpaqueToken();
    const stored = await refreshTokens.create({
      tenantId: 'tenant-1',
      userId: 'user-1',
      tokenHash: tokenService.hashOpaqueToken(plainToken),
      expiresAt: new Date(Date.now() + 60_000),
    });

    await useCase.execute({ refreshToken: plainToken });

    expect(refreshTokens.tokens.find((t) => t.id === stored.id)?.revokedAt).not.toBeNull();
  });

  it('is a silent no-op for an unknown refresh token', async () => {
    await expect(useCase.execute({ refreshToken: 'never-issued' })).resolves.toBeUndefined();
  });
});
