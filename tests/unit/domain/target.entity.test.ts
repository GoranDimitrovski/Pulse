import { describe, expect, it } from 'vitest';

import { Target } from '../../../src/domain/entities/target.entity.js';
import { ValidationError } from '../../../src/domain/errors/domain-error.js';

describe('Target aggregate', () => {
  it('validates config rules', () => {
    expect(() => Target.validateConfig('http', { url: 'https://example.com' })).not.toThrow();
    expect(() => Target.validateConfig('http', {})).toThrow(ValidationError);
    expect(() => Target.validateConfig('tcp', { host: 'example.com' })).toThrow(ValidationError);
    expect(() => Target.validateConfig('tcp', { host: 'example.com', port: 443 })).not.toThrow();
    expect(() => Target.validateConfig('dns', {})).toThrow(ValidationError);
    expect(() => Target.validateConfig('ping', {})).toThrow(ValidationError);
  });

  it('updates its configuration as a single aggregate operation', () => {
    const target = new Target({
      id: 'target-1',
      tenantId: 'tenant-1',
      name: 'Example API',
      type: 'http',
      config: { url: 'https://example.com' },
      intervalSeconds: 30,
      timeoutMs: 5000,
      enabled: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const updated = target.update({
      name: 'Updated API',
      config: { url: 'https://api.example.com' },
      intervalSeconds: 60,
      timeoutMs: 10_000,
      enabled: false,
    });

    expect(updated.name).toBe('Updated API');
    expect(updated.config).toEqual({ url: 'https://api.example.com' });
    expect(updated.intervalSeconds).toBe(60);
    expect(updated.timeoutMs).toBe(10_000);
    expect(updated.enabled).toBe(false);
    expect(updated.updatedAt.getTime()).toBeGreaterThan(target.updatedAt.getTime());
  });
});
