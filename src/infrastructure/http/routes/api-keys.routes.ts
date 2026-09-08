import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from '@fastify/type-provider-zod';
import { z } from 'zod';

import type { Container } from '../../composition/container.js';

const createApiKeyBody = z.object({
  name: z.string().min(1).max(200),
});

const idParams = z.object({ id: z.string().uuid() });

export function registerApiKeyRoutes(container: Container) {
  return async function apiKeyRoutes(app: FastifyInstance) {
    const server = app.withTypeProvider<ZodTypeProvider>();
    const authed = [app.authenticate, app.withTenantContext];

    server.post(
      '/',
      { preHandler: [...authed, app.requireRole('owner')], schema: { body: createApiKeyBody } },
      async (request, reply) => {
        const { apiKey, plainTextKey } = await container.useCases.createApiKey.execute({
          tenantId: request.authUser!.tenantId,
          name: request.body.name,
        });
        reply.status(201).send({ ...apiKey, plainTextKey });
      },
    );

    server.get('/', { preHandler: [...authed, app.requireRole('admin')] }, async (request, reply) => {
      const keys = await container.useCases.listApiKeys.execute(request.authUser!.tenantId);
      reply.status(200).send(keys);
    });

    server.delete(
      '/:id',
      { preHandler: [...authed, app.requireRole('owner')], schema: { params: idParams } },
      async (request, reply) => {
        await container.useCases.revokeApiKey.execute(request.authUser!.tenantId, request.params.id);
        reply.status(204).send();
      },
    );
  };
}
