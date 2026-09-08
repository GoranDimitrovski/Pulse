import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from '@fastify/type-provider-zod';
import { z } from 'zod';

import { ALERT_CHANNEL_TYPES } from '../../../domain/entities/alert-channel.entity.js';
import type { Container } from '../../composition/container.js';

const createAlertChannelBody = z.object({
  type: z.enum(ALERT_CHANNEL_TYPES),
  name: z.string().min(1).max(200),
  url: z.string().url(),
  enabled: z.boolean().default(true),
});

const idParams = z.object({ id: z.string().uuid() });

export function registerAlertRoutes(container: Container) {
  return async function alertRoutes(app: FastifyInstance) {
    const server = app.withTypeProvider<ZodTypeProvider>();
    const authed = [app.authenticate, app.withTenantContext];

    server.post(
      '/',
      { preHandler: [...authed, app.requireRole('admin')], schema: { body: createAlertChannelBody } },
      async (request, reply) => {
        const channel = await container.useCases.createAlertChannel.execute({
          tenantId: request.authUser!.tenantId,
          ...request.body,
        });
        reply.status(201).send(channel);
      },
    );

    server.get('/', { preHandler: authed }, async (request, reply) => {
      const channels = await container.useCases.listAlertChannels.execute(
        request.authUser!.tenantId,
      );
      reply.status(200).send(channels);
    });

    server.delete(
      '/:id',
      { preHandler: [...authed, app.requireRole('admin')], schema: { params: idParams } },
      async (request, reply) => {
        await container.useCases.deleteAlertChannel.execute(
          request.authUser!.tenantId,
          request.params.id,
        );
        reply.status(204).send();
      },
    );
  };
}
