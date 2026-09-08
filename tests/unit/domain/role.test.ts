import { describe, expect, it } from 'vitest';

import { roleAtLeast } from '../../../src/domain/entities/role.js';

describe('roleAtLeast', () => {
  it('allows an equal role', () => {
    expect(roleAtLeast('admin', 'admin')).toBe(true);
  });

  it('allows a higher role to satisfy a lower requirement', () => {
    expect(roleAtLeast('owner', 'member')).toBe(true);
  });

  it('rejects a lower role', () => {
    expect(roleAtLeast('member', 'admin')).toBe(false);
  });
});
