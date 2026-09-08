import { describe, expect, it } from 'vitest';

import { User } from '../../../src/domain/entities/user.entity.js';

describe('User.toPublic', () => {
  it('strips passwordHash and keeps every other field', () => {
    const user = new User({
      id: 'user-1',
      tenantId: 'tenant-1',
      email: 'owner@acme.test',
      passwordHash: 'super-secret-hash',
      role: 'owner',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const publicUser = user.toPublic();

    expect(publicUser).not.toHaveProperty('passwordHash');
    expect(publicUser).toEqual({
      id: 'user-1',
      tenantId: 'tenant-1',
      email: 'owner@acme.test',
      role: 'owner',
      createdAt: user.createdAt,
    });
  });
});
