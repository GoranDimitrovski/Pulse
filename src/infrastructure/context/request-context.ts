import { AsyncLocalStorage } from 'node:async_hooks';

import type { Role } from '../../domain/entities/role.js';

export interface RequestContextStore {
  readonly requestId: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly role: Role;
}

const storage = new AsyncLocalStorage<RequestContextStore>();

/**
 * Carries the authenticated tenant/user through the async call stack so that
 * downstream code (loggers, use cases, background work spawned from a request)
 * can read it without threading it through every function signature.
 */
export const requestContext = {
  run<T>(store: RequestContextStore, callback: () => T): T {
    return storage.run(store, callback);
  },
  get(): RequestContextStore | undefined {
    return storage.getStore();
  },
};
