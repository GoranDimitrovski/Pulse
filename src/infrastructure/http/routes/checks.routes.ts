import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from '@fastify/type-provider-zod';
import { z } from 'zod';

import type { Container } from '../../composition/container.js';

const idParams = z.object({ id: z.string().uuid() });

const historyQuery = z.object({
  sinceHours: z.coerce
    .number()
    .int()
    .min(1)
    .max(24 * 30)
    .default(24),
  limit: z.coerce.number().int().min(1).max(1000).default(200),
});

export function registerCheckRoutes(container: Container) {
  return async function checkRoutes(app: FastifyInstance) {
    const server = app.withTypeProvider<ZodTypeProvider>();
    const authed = [app.authenticate, app.withTenantContext];

    server.get('/dashboard', { preHandler: authed }, async (request, reply) => {
      const snapshot = await container.useCases.getDashboardSnapshot.execute(
        request.authUser!.tenantId,
      );
      reply.status(200).send(snapshot);
    });

    server.get(
      '/targets/:id/history',
      { preHandler: authed, schema: { params: idParams, querystring: historyQuery } },
      async (request, reply) => {
        const since = new Date(Date.now() - request.query.sinceHours * 60 * 60 * 1000);
        const history = await container.useCases.getTargetHistory.execute({
          tenantId: request.authUser!.tenantId,
          targetId: request.params.id,
          since,
          limit: request.query.limit,
        });
        reply.status(200).send(history);
      },
    );
  };
}
