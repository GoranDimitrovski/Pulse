import { describe, expect, it } from 'vitest';

import { ValidationError } from '../../../src/domain/errors/domain-error.js';
import { Email } from '../../../src/domain/value-objects/email.js';

describe('Email', () => {
  it('accepts a well-formed address', () => {
    expect(Email.create('owner@acme.test').value).toBe('owner@acme.test');
  });

  it('normalizes casing and surrounding whitespace', () => {
    expect(Email.create('  Owner@Acme.TEST  ').value).toBe('owner@acme.test');
  });

  it('rejects a malformed address', () => {
    expect(() => Email.create('not-an-email')).toThrow(ValidationError);
  });
});
