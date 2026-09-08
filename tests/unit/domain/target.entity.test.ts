import { describe, expect, it } from 'vitest';

import { Target } from '../../../src/domain/entities/target.entity.js';
import { ValidationError } from '../../../src/domain/errors/domain-error.js';

describe('Target.validateConfig', () => {
  it('accepts an http target with a url', () => {
    expect(() => Target.validateConfig('http', { url: 'https://example.com' })).not.toThrow();
  });

  it('rejects an http target without a url', () => {
    expect(() => Target.validateConfig('http', {})).toThrow(ValidationError);
  });

  it('rejects a tcp target missing the port', () => {
    expect(() => Target.validateConfig('tcp', { host: 'example.com' })).toThrow(ValidationError);
  });

  it('accepts a tcp target with host and port', () => {
    expect(() => Target.validateConfig('tcp', { host: 'example.com', port: 443 })).not.toThrow();
  });

  it('rejects a dns target without a host', () => {
    expect(() => Target.validateConfig('dns', {})).toThrow(ValidationError);
  });

  it('rejects a ping target without a host', () => {
    expect(() => Target.validateConfig('ping', {})).toThrow(ValidationError);
  });
});
