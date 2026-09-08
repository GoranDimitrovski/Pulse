import { describe, expect, it } from 'vitest';

import { CheckResult } from '../../../src/domain/entities/check-result.entity.js';

function makeResult(status: 'up' | 'down' | 'degraded'): CheckResult {
  return new CheckResult({
    id: 'result-1',
    tenantId: 'tenant-1',
    targetId: 'target-1',
    status,
    latencyMs: 10,
    message: null,
    checkedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

describe('CheckResult.hasStatusChangeFrom', () => {
  it('is a change when there is no previous result', () => {
    expect(makeResult('up').hasStatusChangeFrom(null)).toBe(true);
  });

  it('is a change when the status differs from the previous result', () => {
    expect(makeResult('down').hasStatusChangeFrom(makeResult('up'))).toBe(true);
  });

  it('is not a change when the status matches the previous result', () => {
    expect(makeResult('up').hasStatusChangeFrom(makeResult('up'))).toBe(false);
  });
});
