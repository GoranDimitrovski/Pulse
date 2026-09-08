import type { FastifyInstance } from 'fastify';

export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/healthz', async (_request, reply) => {
    reply.status(200).send({ status: 'ok' });
  });

  app.get('/readyz', async (_request, reply) => {
    reply.status(200).send({ status: 'ready' });
  });
}
