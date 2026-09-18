import { beforeEach, describe, expect, it } from 'vitest';

import { ResetPasswordUseCase } from '../../../src/application/use-cases/auth/reset-password.use-case.js';
import { UnauthorizedError } from '../../../src/domain/errors/domain-error.js';
import { FakeClock } from '../../fakes/fake-clock.js';
import { FakePasswordHasher } from '../../fakes/fake-password-hasher.js';
import { FakeTokenService } from '../../fakes/fake-token-service.js';
import { InMemoryPasswordResetTokenRepository } from '../../fakes/in-memory-password-reset-token.repository.js';
import { InMemoryRefreshTokenRepository } from '../../fakes/in-memory-refresh-token.repository.js';
import { InMemoryUserRepository } from '../../fakes/in-memory-user.repository.js';

describe('ResetPasswordUseCase', () => {
  let users: InMemoryUserRepository;
  let resetTokens: InMemoryPasswordResetTokenRepository;
  let refreshTokens: InMemoryRefreshTokenRepository;
  let tokenService: FakeTokenService;
  let clock: FakeClock;
  let useCase: ResetPasswordUseCase;

  beforeEach(async () => {
    users = new InMemoryUserRepository();
    resetTokens = new InMemoryPasswordResetTokenRepository();
    refreshTokens = new InMemoryRefreshTokenRepository();
    tokenService = new FakeTokenService();
    clock = new FakeClock();
    useCase = new ResetPasswordUseCase(
      users,
      resetTokens,
      refreshTokens,
      tokenService,
      new FakePasswordHasher(),
      clock,
    );

    await users.create({
      tenantId: 'tenant-1',
      email: 'user@test.com',
      passwordHash: 'hashed:old-password',
      role: 'member',
    });
  });

  async function issueResetToken(
    tenantId: string,
    userId: string,
    expiresInMs = 60_000,
  ): Promise<string> {
    const plain = tokenService.generateOpaqueToken();
    await resetTokens.create({
      tenantId,
      userId,
      tokenHash: tokenService.hashOpaqueToken(plain),
      expiresAt: new Date(clock.now().getTime() + expiresInMs),
    });
    return plain;
  }

  it('updates the password and revokes every refresh token for that user', async () => {
    const user = users.users[0]!;
    await refreshTokens.create({
      tenantId: user.tenantId,
      userId: user.id,
      tokenHash: 'some-other-session',
      expiresAt: new Date(clock.now().getTime() + 60_000),
    });
    const plainToken = await issueResetToken(user.tenantId, user.id);

    await useCase.execute({ resetToken: plainToken, newPassword: 'new-password' });

    expect(users.users[0]!.passwordHash).toBe('hashed:new-password');
    expect(refreshTokens.tokens.every((t) => t.revokedAt !== null)).toBe(true);
  });

  it('marks the reset token used so it cannot be replayed', async () => {
    const user = users.users[0]!;
    const plainToken = await issueResetToken(user.tenantId, user.id);

    await useCase.execute({ resetToken: plainToken, newPassword: 'new-password' });

    await expect(
      useCase.execute({ resetToken: plainToken, newPassword: 'another-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('rejects a token whose tenant does not own the user it names', async () => {
    const outsider = await users.create({
      tenantId: 'tenant-2',
      email: 'outsider@test.com',
      passwordHash: 'hashed:outsider-password',
      role: 'member',
    });
    // A token claiming tenant-1 but pointing at tenant-2's user: the user lookup is scoped
    // to the token's tenant, so this resolves to nobody rather than resetting across tenants.
    const plainToken = await issueResetToken('tenant-1', outsider.id);

    await expect(
      useCase.execute({ resetToken: plainToken, newPassword: 'new-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(users.users[1]!.passwordHash).toBe('hashed:outsider-password');
  });

  it('rejects an unknown reset token', async () => {
    await expect(
      useCase.execute({ resetToken: 'never-issued', newPassword: 'new-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('rejects an expired reset token', async () => {
    const user = users.users[0]!;
    const plainToken = await issueResetToken(user.tenantId, user.id, 60_000);
    clock.advanceMs(60_001);

    await expect(
      useCase.execute({ resetToken: plainToken, newPassword: 'new-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
