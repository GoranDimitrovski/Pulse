import { describe, expect, it } from 'vitest';

import { WorkerPool } from '../../../src/infrastructure/concurrency/worker-pool.js';

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

describe('WorkerPool', () => {
  it('runs tasks up to the concurrency limit immediately', async () => {
    const pool = new WorkerPool(2);
    const gates = [deferred<void>(), deferred<void>(), deferred<void>()];
    const started: number[] = [];

    const tasks = gates.map((gate, index) =>
      pool.run(async () => {
        started.push(index);
        await gate.promise;
      }),
    );

    await new Promise((r) => setImmediate(r));
    expect(started).toEqual([0, 1]); // 3rd task queued, not started yet

    gates[0]!.resolve();
    await new Promise((r) => setImmediate(r));
    await new Promise((r) => setImmediate(r));
    expect(started).toEqual([0, 1, 2]);

    gates[1]!.resolve();
    gates[2]!.resolve();
    await Promise.all(tasks);
  });

  it('returns the task result', async () => {
    const pool = new WorkerPool(1);
    const result = await pool.run(() => Promise.resolve(42));
    expect(result).toBe(42);
  });

  it('releases the slot even when a task throws', async () => {
    const pool = new WorkerPool(1);
    await expect(pool.run(() => Promise.reject(new Error('fail')))).rejects.toThrow('fail');

    const result = await pool.run(() => Promise.resolve('next'));
    expect(result).toBe('next');
  });
});
