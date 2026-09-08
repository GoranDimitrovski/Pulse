import { createHash } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { ApiKey } from '../../../src/domain/entities/api-key.entity.js';

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function makeKey(overrides: Partial<{ revokedAt: Date | null }> = {}): ApiKey {
  return new ApiKey({
    id: 'key-1',
    tenantId: 'tenant-1',
    name: 'ci-key',
    keyHash: hash('secret'),
    keyPrefix: 'pk_abc123',
    lastUsedAt: null,
    revokedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });
}

describe('ApiKey', () => {
  it('is not revoked by default, revoked once revokedAt is set', () => {
    expect(makeKey().isRevoked()).toBe(false);
    expect(makeKey({ revokedAt: new Date() }).isRevoked()).toBe(true);
  });

  it('matchesHash is true only for the exact hash', () => {
    const key = makeKey();
    expect(key.matchesHash(hash('secret'))).toBe(true);
    expect(key.matchesHash(hash('wrong-secret'))).toBe(false);
  });

  it('matchesHash is false for a hash of different length (no crash)', () => {
    expect(makeKey().matchesHash('short')).toBe(false);
  });
});
