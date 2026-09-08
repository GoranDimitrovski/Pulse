import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from '@fastify/type-provider-zod';
import { z } from 'zod';

import { CHECK_TYPES } from '../../../domain/entities/target.entity.js';
import type { Container } from '../../composition/container.js';

const targetConfigSchema = z.object({
  url: z.string().url().optional(),
  host: z.string().min(1).optional(),
  port: z.coerce.number().int().min(1).max(65_535).optional(),
  recordType: z.string().optional(),
  expectedStatusCodes: z.array(z.number().int()).optional(),
});

const createTargetBody = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(CHECK_TYPES),
  config: targetConfigSchema,
  intervalSeconds: z.number().int().min(5).max(86_400).default(60),
  timeoutMs: z.number().int().min(100).max(60_000).default(5000),
  enabled: z.boolean().default(true),
});

const updateTargetBody = z.object({
  name: z.string().min(1).max(200).optional(),
  config: targetConfigSchema.optional(),
  intervalSeconds: z.number().int().min(5).max(86_400).optional(),
  timeoutMs: z.number().int().min(100).max(60_000).optional(),
  enabled: z.boolean().optional(),
});

const idParams = z.object({ id: z.string().uuid() });

export function registerTargetRoutes(container: Container) {
  return async function targetRoutes(app: FastifyInstance) {
    const server = app.withTypeProvider<ZodTypeProvider>();
    const authed = [app.authenticate, app.withTenantContext];

    server.post(
      '/',
      { preHandler: [...authed, app.requireRole('admin')], schema: { body: createTargetBody } },
      async (request, reply) => {
        const target = await container.useCases.createTarget.execute({
          tenantId: request.authUser!.tenantId,
          ...request.body,
        });
        reply.status(201).send(target);
      },
    );

    server.get('/', { preHandler: authed }, async (request, reply) => {
      const targets = await container.useCases.listTargets.execute(request.authUser!.tenantId);
      reply.status(200).send(targets);
    });

    server.get(
      '/:id',
      { preHandler: authed, schema: { params: idParams } },
      async (request, reply) => {
        const target = await container.useCases.getTarget.execute(
          request.authUser!.tenantId,
          request.params.id,
        );
        reply.status(200).send(target);
      },
    );

    server.patch(
      '/:id',
      {
        preHandler: [...authed, app.requireRole('admin')],
        schema: { params: idParams, body: updateTargetBody },
      },
      async (request, reply) => {
        const target = await container.useCases.updateTarget.execute(
          request.authUser!.tenantId,
          request.params.id,
          request.body,
        );
        reply.status(200).send(target);
      },
    );

    server.delete(
      '/:id',
      { preHandler: [...authed, app.requireRole('admin')], schema: { params: idParams } },
      async (request, reply) => {
        await container.useCases.deleteTarget.execute(request.authUser!.tenantId, request.params.id);
        reply.status(204).send();
      },
    );
  };
}
