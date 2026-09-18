import type { FastifyInstance } from 'fastify';

import type { Container } from '../../composition/container.js';

export function registerMetricsRoutes(container: Container) {
  return async function metricsRoutes(app: FastifyInstance) {
    // The Service is a public LoadBalancer, so /metrics would otherwise be open to the
    // internet. Any authenticated principal may read it — these are process/check counters
    // with no tenant labels — so a scraper just needs an X-API-Key.
    app.get('/', { preHandler: [app.authenticate] }, async (_request, reply) => {
      reply.header('content-type', container.metrics.registry.contentType);
      reply.send(await container.metrics.registry.metrics());
    });
  };
}
