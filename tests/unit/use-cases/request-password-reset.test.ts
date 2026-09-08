import { beforeEach, describe, expect, it } from 'vitest';

import { RequestPasswordResetUseCase } from '../../../src/application/use-cases/auth/request-password-reset.use-case.js';
import { FakeClock } from '../../fakes/fake-clock.js';
import { FakeMailer } from '../../fakes/fake-mailer.js';
import { FakeTokenService } from '../../fakes/fake-token-service.js';
import { InMemoryPasswordResetTokenRepository } from '../../fakes/in-memory-password-reset-token.repository.js';
import { InMemoryUserRepository } from '../../fakes/in-memory-user.repository.js';

describe('RequestPasswordResetUseCase', () => {
  let users: InMemoryUserRepository;
  let resetTokens: InMemoryPasswordResetTokenRepository;
  let mailer: FakeMailer;
  let useCase: RequestPasswordResetUseCase;

  beforeEach(async () => {
    users = new InMemoryUserRepository();
    resetTokens = new InMemoryPasswordResetTokenRepository();
    mailer = new FakeMailer();
    useCase = new RequestPasswordResetUseCase(
      users,
      resetTokens,
      new FakeTokenService(),
      mailer,
      new FakeClock(),
    );

    await users.create({
      tenantId: 'tenant-1',
      email: 'user@test.com',
      passwordHash: 'hashed:x',
      role: 'member',
    });
  });

  it('creates a reset token and emails it for a known account', async () => {
    await useCase.execute({ email: 'user@test.com' });

    expect(resetTokens.tokens).toHaveLength(1);
    expect(mailer.sent).toHaveLength(1);
    expect(mailer.sent[0]!.to).toBe('user@test.com');
  });

  it('matches the account regardless of email casing', async () => {
    await useCase.execute({ email: 'User@Test.com' });
    expect(mailer.sent).toHaveLength(1);
  });

  it('is silent for an unknown email (never reveals whether the account exists)', async () => {
    await useCase.execute({ email: 'nobody@test.com' });
    expect(resetTokens.tokens).toHaveLength(0);
    expect(mailer.sent).toHaveLength(0);
  });

  it('is silent for a malformed email', async () => {
    await useCase.execute({ email: 'not-an-email' });
    expect(resetTokens.tokens).toHaveLength(0);
    expect(mailer.sent).toHaveLength(0);
  });
});
