import { beforeEach, describe, expect, it } from 'vitest';

import { LoginUseCase } from '../../../src/application/use-cases/auth/login.use-case.js';
import { UnauthorizedError } from '../../../src/domain/errors/domain-error.js';
import { FakeClock } from '../../fakes/fake-clock.js';
import { FakePasswordHasher } from '../../fakes/fake-password-hasher.js';
import { FakeTokenService } from '../../fakes/fake-token-service.js';
import { InMemoryRefreshTokenRepository } from '../../fakes/in-memory-refresh-token.repository.js';
import { InMemoryUserRepository } from '../../fakes/in-memory-user.repository.js';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

describe('LoginUseCase', () => {
  let users: InMemoryUserRepository;
  let refreshTokens: InMemoryRefreshTokenRepository;
  let useCase: LoginUseCase;

  beforeEach(async () => {
    users = new InMemoryUserRepository();
    refreshTokens = new InMemoryRefreshTokenRepository();
    useCase = new LoginUseCase(
      users,
      refreshTokens,
      new FakePasswordHasher(),
      new FakeTokenService(),
      new FakeClock(),
      ONE_DAY_MS,
    );

    await users.create({
      tenantId: 'tenant-1',
      email: 'user@test.com',
      passwordHash: 'hashed:correct-password',
      role: 'member',
    });
  });

  it('issues tokens for valid credentials', async () => {
    const tokens = await useCase.execute({ email: 'user@test.com', password: 'correct-password' });

    expect(tokens.accessToken).toContain('access:');
    expect(refreshTokens.tokens).toHaveLength(1);
    expect(refreshTokens.tokens[0]!.tenantId).toBe('tenant-1');
  });

  it('matches an email regardless of the casing used to log in', async () => {
    const tokens = await useCase.execute({ email: 'User@Test.com', password: 'correct-password' });
    expect(tokens.accessToken).toContain('access:');
  });

  it('rejects an unknown email', async () => {
    await expect(
      useCase.execute({ email: 'nobody@test.com', password: 'whatever' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('rejects an incorrect password', async () => {
    await expect(
      useCase.execute({ email: 'user@test.com', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
