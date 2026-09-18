import { describe, expect, it } from 'vitest';

import { User } from '../../../src/domain/entities/user.entity.js';

describe('User aggregate', () => {
  it('updates the password hash as a single aggregate mutation', () => {
    const user = new User({
      id: 'user-1',
      tenantId: 'tenant-1',
      email: 'owner@acme.test',
      passwordHash: 'old-hash',
      role: 'owner',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const updated = user.changePasswordHash('new-hash');

    expect(updated.passwordHash).toBe('new-hash');
    expect(updated.id).toBe(user.id);
    expect(updated.email).toBe(user.email);
  });
});
