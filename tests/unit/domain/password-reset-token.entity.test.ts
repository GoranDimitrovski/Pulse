import { describe, expect, it } from 'vitest';

import { PasswordResetToken } from '../../../src/domain/entities/password-reset-token.entity.js';

function makeToken(
  overrides: Partial<{ usedAt: Date | null; expiresAt: Date }> = {},
): PasswordResetToken {
  return new PasswordResetToken({
    id: 'reset-1',
    userId: 'user-1',
    tokenHash: 'hash',
    expiresAt: new Date('2026-01-01T02:00:00.000Z'),
    usedAt: null,
    createdAt: new Date('2026-01-01T01:00:00.000Z'),
    ...overrides,
  });
}

describe('PasswordResetToken.isValid', () => {
  const now = new Date('2026-01-01T01:30:00.000Z');

  it('is valid before expiry and when unused', () => {
    expect(makeToken().isValid(now)).toBe(true);
  });

  it('is invalid once used', () => {
    expect(makeToken({ usedAt: now }).isValid(now)).toBe(false);
  });

  it('is invalid once expired', () => {
    expect(makeToken({ expiresAt: new Date('2026-01-01T01:00:00.000Z') }).isValid(now)).toBe(false);
  });
});
