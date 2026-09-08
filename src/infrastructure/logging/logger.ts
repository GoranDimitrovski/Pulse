import pino, { type Logger } from 'pino';

import type { Env } from '../../shared/config/env.js';
import { requestContext } from '../context/request-context.js';

export function createLogger(env: Env): Logger {
  return pino({
    level: env.LOG_LEVEL,
    transport:
      env.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
        : undefined,
    base: { service: 'pulse' },
    mixin() {
      const store = requestContext.get();
      return store ? { tenantId: store.tenantId, userId: store.userId } : {};
    },
  });
}

export type { Logger };
