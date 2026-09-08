import { describe, expect, it } from 'vitest';

import { GetDashboardSnapshotUseCase } from '../../../src/application/use-cases/checks/get-dashboard-snapshot.use-case.js';
import { InMemoryCheckResultRepository } from '../../fakes/in-memory-check-result.repository.js';
import { InMemoryTargetRepository } from '../../fakes/in-memory-target.repository.js';

describe('GetDashboardSnapshotUseCase', () => {
  it('pairs each target with its latest result, or null if never checked', async () => {
    const targets = new InMemoryTargetRepository();
    const checkResults = new InMemoryCheckResultRepository();

    const checkedTarget = await targets.create({
      tenantId: 'tenant-1',
      name: 'Checked',
      type: 'http',
      config: { url: 'https://example.com' },
      intervalSeconds: 60,
      timeoutMs: 5000,
      enabled: true,
    });
    const uncheckedTarget = await targets.create({
      tenantId: 'tenant-1',
      name: 'Unchecked',
      type: 'http',
      config: { url: 'https://other.example.com' },
      intervalSeconds: 60,
      timeoutMs: 5000,
      enabled: true,
    });
    await checkResults.create({
      tenantId: 'tenant-1',
      targetId: checkedTarget.id,
      status: 'up',
      latencyMs: 12,
      message: null,
    });

    const useCase = new GetDashboardSnapshotUseCase(targets, checkResults);
    const snapshot = await useCase.execute('tenant-1');

    const checkedEntry = snapshot.find((e) => e.target.id === checkedTarget.id);
    const uncheckedEntry = snapshot.find((e) => e.target.id === uncheckedTarget.id);

    expect(checkedEntry?.latestResult?.status).toBe('up');
    expect(uncheckedEntry?.latestResult).toBeNull();
  });

  it('only includes targets belonging to the given tenant', async () => {
    const targets = new InMemoryTargetRepository();
    const checkResults = new InMemoryCheckResultRepository();
    await targets.create({
      tenantId: 'tenant-2',
      name: 'Other tenant target',
      type: 'http',
      config: { url: 'https://example.com' },
      intervalSeconds: 60,
      timeoutMs: 5000,
      enabled: true,
    });

    const useCase = new GetDashboardSnapshotUseCase(targets, checkResults);
    const snapshot = await useCase.execute('tenant-1');

    expect(snapshot).toHaveLength(0);
  });
});
