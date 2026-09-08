import { beforeEach, describe, expect, it } from 'vitest';

import { RefreshSessionUseCase } from '../../../src/application/use-cases/auth/refresh-session.use-case.js';
import { UnauthorizedError } from '../../../src/domain/errors/domain-error.js';
import { FakeClock } from '../../fakes/fake-clock.js';
import { FakeTokenService } from '../../fakes/fake-token-service.js';
import { InMemoryRefreshTokenRepository } from '../../fakes/in-memory-refresh-token.repository.js';
import { InMemoryUserRepository } from '../../fakes/in-memory-user.repository.js';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

describe('RefreshSessionUseCase', () => {
  let users: InMemoryUserRepository;
  let refreshTokens: InMemoryRefreshTokenRepository;
  let tokenService: FakeTokenService;
  let clock: FakeClock;
  let useCase: RefreshSessionUseCase;

  beforeEach(async () => {
    users = new InMemoryUserRepository();
    refreshTokens = new InMemoryRefreshTokenRepository();
    tokenService = new FakeTokenService();
    clock = new FakeClock();
    useCase = new RefreshSessionUseCase(users, refreshTokens, tokenService, clock, ONE_DAY_MS);

    await users.create({
      tenantId: 'tenant-1',
      email: 'user@test.com',
      passwordHash: 'hashed:x',
      role: 'member',
    });
  });

  async function issueToken(userId: string): Promise<string> {
    const plain = tokenService.generateOpaqueToken();
    await refreshTokens.create({
      tenantId: 'tenant-1',
      userId,
      tokenHash: tokenService.hashOpaqueToken(plain),
      expiresAt: new Date(clock.now().getTime() + ONE_DAY_MS),
    });
    return plain;
  }

  it('rotates the refresh token and issues a new access token', async () => {
    const user = users.users[0]!;
    const plainToken = await issueToken(user.id);

    const tokens = await useCase.execute({ refreshToken: plainToken });

    expect(tokens.accessToken).toContain('access:');
    expect(tokens.refreshToken).not.toBe(plainToken);

    const oldStored = refreshTokens.tokens.find(
      (t) => t.tokenHash === tokenService.hashOpaqueToken(plainToken),
    );
    expect(oldStored?.revokedAt).not.toBeNull();
  });

  it('rejects an unknown refresh token', async () => {
    await expect(useCase.execute({ refreshToken: 'does-not-exist' })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it('rejects a revoked refresh token (replay detection)', async () => {
    const user = users.users[0]!;
    const plainToken = await issueToken(user.id);

    await useCase.execute({ refreshToken: plainToken });

    await expect(useCase.execute({ refreshToken: plainToken })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it('rejects an expired refresh token', async () => {
    const user = users.users[0]!;
    const plainToken = await issueToken(user.id);
    clock.advanceMs(ONE_DAY_MS + 1000);

    await expect(useCase.execute({ refreshToken: plainToken })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });
});
