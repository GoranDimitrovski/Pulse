import type { FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

import { UnauthorizedError } from '../../../domain/errors/domain-error.js';
import { requestContext } from '../../context/request-context.js';

declare module 'fastify' {
  interface FastifyInstance {
    withTenantContext: (
      request: FastifyRequest,
      reply: FastifyReply,
      done: (err?: Error) => void,
    ) => void;
  }
}

/**
 * Must run after `authenticate`. Binds the verified tenant/user onto an AsyncLocalStorage
 * store for the remainder of the request, so any code invoked deeper in the call stack
 * (loggers, background-triggered work) can read it without an explicit parameter.
 */
export default fp(function tenantContextPlugin(app) {
  app.decorate(
    'withTenantContext',
    (request: FastifyRequest, _reply: FastifyReply, done: (err?: Error) => void) => {
      if (!request.authUser) {
        done(new UnauthorizedError());
        return;
      }
      requestContext.run(
        {
          requestId: request.id,
          tenantId: request.authUser.tenantId,
          userId: request.authUser.userId,
          role: request.authUser.role,
        },
        done,
      );
    },
  );
});
