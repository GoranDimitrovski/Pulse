/**
 * Bounded-concurrency task pool for the I/O-bound health checks (HTTP/TCP/DNS requests,
 * spawned ping processes). A fixed number of "worker slots" pull tasks off an internal
 * queue, capping how many checks run at once regardless of how many targets exist.
 *
 * ponytail: this is an async semaphore, not an OS worker_threads pool — the work here is
 * I/O-bound (network calls), where Node's event loop already parallelizes fine; threads
 * would only add serialization overhead. Swap in piscina if checks become CPU-bound
 * (e.g. heavy response-body parsing).
 */
export class WorkerPool {
  private running = 0;
  private readonly queue: Array<() => void> = [];

  constructor(private readonly concurrency: number) {}

  async run<T>(task: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await task();
    } finally {
      this.release();
    }
  }

  get activeCount(): number {
    return this.running;
  }

  get queuedCount(): number {
    return this.queue.length;
  }

  private acquire(): Promise<void> {
    if (this.running < this.concurrency) {
      this.running += 1;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }

  private release(): void {
    const next = this.queue.shift();
    if (next) {
      next();
      return;
    }
    this.running = Math.max(0, this.running - 1);
  }
}
