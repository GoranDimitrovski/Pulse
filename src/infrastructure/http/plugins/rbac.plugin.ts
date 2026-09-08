import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify';
import fp from 'fastify-plugin';

import { roleAtLeast, type Role } from '../../../domain/entities/role.js';
import { ForbiddenError, UnauthorizedError } from '../../../domain/errors/domain-error.js';

declare module 'fastify' {
  interface FastifyInstance {
    requireRole: (role: Role) => preHandlerHookHandler;
  }
}

export default fp(function rbacPlugin(app) {
  app.decorate('requireRole', (role: Role) => {
    return async (request: FastifyRequest, _reply: FastifyReply) => {
      if (!request.authUser) {
        throw new UnauthorizedError();
      }
      if (!roleAtLeast(request.authUser.role, role)) {
        throw new ForbiddenError(`Requires role '${role}' or higher`);
      }
    };
  });
});
