import { describe, expect, it } from 'vitest';

import { RefreshToken } from '../../../src/domain/entities/refresh-token.entity.js';

function makeToken(
  overrides: Partial<{ revokedAt: Date | null; expiresAt: Date }> = {},
): RefreshToken {
  return new RefreshToken({
    id: 'token-1',
    tenantId: 'tenant-1',
    userId: 'user-1',
    tokenHash: 'hash',
    expiresAt: new Date('2026-01-02T00:00:00.000Z'),
    revokedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });
}

describe('RefreshToken aggregate', () => {
  const now = new Date('2026-01-01T12:00:00.000Z');

  it('is valid before expiry and when not revoked', () => {
    expect(makeToken().isValid(now)).toBe(true);
  });

  it('revokes itself as a single aggregate mutation', () => {
    const revoked = makeToken().revoke(now);
    expect(revoked.revokedAt).toEqual(now);
    expect(revoked.isRevoked()).toBe(true);
  });

  it('is invalid once revoked', () => {
    expect(makeToken({ revokedAt: now }).isValid(now)).toBe(false);
  });

  it('is invalid once expired', () => {
    expect(makeToken({ expiresAt: new Date('2026-01-01T00:00:00.000Z') }).isValid(now)).toBe(false);
  });
});
