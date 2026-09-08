import type { FastifyInstance } from 'fastify';

import type { Container } from '../../composition/container.js';

export function registerMetricsRoutes(container: Container) {
  return async function metricsRoutes(app: FastifyInstance) {
    app.get('/', async (_request, reply) => {
      reply.header('content-type', container.metrics.registry.contentType);
      reply.send(await container.metrics.registry.metrics());
    });
  };
}
