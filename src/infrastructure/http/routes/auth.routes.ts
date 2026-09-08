import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from '@fastify/type-provider-zod';
import { z } from 'zod';

import type { Container } from '../../composition/container.js';

const registerBody = z.object({
  tenantName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

const loginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshBody = z.object({
  refreshToken: z.string().min(1),
});

const requestResetBody = z.object({
  email: z.string().email(),
});

const resetPasswordBody = z.object({
  resetToken: z.string().min(1),
  newPassword: z.string().min(8).max(200),
});

export function registerAuthRoutes(container: Container) {
  return async function authRoutes(app: FastifyInstance) {
    const server = app.withTypeProvider<ZodTypeProvider>();

    server.post('/register', { schema: { body: registerBody } }, async (request, reply) => {
      const result = await container.useCases.registerTenant.execute(request.body);
      reply.status(201).send(result);
    });

    server.post('/login', { schema: { body: loginBody } }, async (request, reply) => {
      const tokens = await container.useCases.login.execute(request.body);
      reply.status(200).send(tokens);
    });

    server.post('/refresh', { schema: { body: refreshBody } }, async (request, reply) => {
      const tokens = await container.useCases.refreshSession.execute(request.body);
      reply.status(200).send(tokens);
    });

    server.post('/logout', { schema: { body: refreshBody } }, async (request, reply) => {
      await container.useCases.logout.execute(request.body);
      reply.status(204).send();
    });

    server.post(
      '/password-reset/request',
      { schema: { body: requestResetBody } },
      async (request, reply) => {
        await container.useCases.requestPasswordReset.execute(request.body);
        reply.status(202).send({ message: 'If the email exists, a reset link has been sent' });
      },
    );

    server.post(
      '/password-reset/confirm',
      { schema: { body: resetPasswordBody } },
      async (request, reply) => {
        await container.useCases.resetPassword.execute(request.body);
        reply.status(200).send({ message: 'Password updated' });
      },
    );

    server.get(
      '/me',
      { preHandler: [app.authenticate, app.withTenantContext] },
      async (request, reply) => {
        reply.status(200).send(request.authUser);
      },
    );
  };
}
