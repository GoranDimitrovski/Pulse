import { describe, expect, it, vi } from 'vitest';

import { CircuitBreaker, CircuitOpenError } from '../../../src/infrastructure/concurrency/circuit-breaker.js';

describe('CircuitBreaker', () => {
  it('starts closed and allows calls through', async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 1000 });
    const result = await breaker.execute(() => Promise.resolve('ok'));
    expect(result).toBe('ok');
    expect(breaker.getState()).toBe('closed');
  });

  it('opens after reaching the failure threshold', async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 10_000 });
    const failing = () => Promise.reject(new Error('boom'));

    await expect(breaker.execute(failing)).rejects.toThrow('boom');
    expect(breaker.getState()).toBe('closed');

    await expect(breaker.execute(failing)).rejects.toThrow('boom');
    expect(breaker.getState()).toBe('open');
  });

  it('short-circuits calls while open, without invoking the function', async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 10_000 });
    const fn = vi.fn(() => Promise.reject(new Error('boom')));

    await expect(breaker.execute(fn)).rejects.toThrow('boom');
    expect(breaker.getState()).toBe('open');

    await expect(breaker.execute(fn)).rejects.toBeInstanceOf(CircuitOpenError);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('transitions to half-open after the reset timeout and closes on success', async () => {
    vi.useFakeTimers();
    try {
      const breaker = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 5000 });
      await expect(breaker.execute(() => Promise.reject(new Error('boom')))).rejects.toThrow();
      expect(breaker.getState()).toBe('open');

      vi.advanceTimersByTime(5001);

      const result = await breaker.execute(() => Promise.resolve('recovered'));
      expect(result).toBe('recovered');
      expect(breaker.getState()).toBe('closed');
    } finally {
      vi.useRealTimers();
    }
  });

  it('re-opens immediately on a half-open failure', async () => {
    vi.useFakeTimers();
    try {
      const breaker = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 1000 });
      await expect(breaker.execute(() => Promise.reject(new Error('boom')))).rejects.toThrow();
      vi.advanceTimersByTime(1001);

      await expect(breaker.execute(() => Promise.reject(new Error('still down')))).rejects.toThrow(
        'still down',
      );
      expect(breaker.getState()).toBe('open');
    } finally {
      vi.useRealTimers();
    }
  });
});
