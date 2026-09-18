import path from 'node:path';
import { fileURLToPath } from 'node:url';

import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import staticPlugin from '@fastify/static';
import websocketPlugin from '@fastify/websocket';
import fastify from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from '@fastify/type-provider-zod';

import type { Container } from '../composition/container.js';
import type { Logger } from '../logging/logger.js';
import errorHandlerPlugin from './plugins/error-handler.plugin.js';
import { createAuthPlugin } from './plugins/auth.plugin.js';
import tenantContextPlugin from './plugins/tenant-context.plugin.js';
import rbacPlugin from './plugins/rbac.plugin.js';
import { registerAuthRoutes } from './routes/auth.routes.js';
import { registerTargetRoutes } from './routes/targets.routes.js';
import { registerCheckRoutes } from './routes/checks.routes.js';
import { registerAlertRoutes } from './routes/alerts.routes.js';
import { registerApiKeyRoutes } from './routes/api-keys.routes.js';
import { registerWebsocketRoutes } from './routes/websocket.routes.js';
import { registerMetricsRoutes } from './routes/metrics.routes.js';
import { registerHealthRoutes } from './routes/health.routes.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const webDistDir = path.resolve(currentDir, '../../../web/dist');

export async function buildApp(container: Container, logger: Logger) {
  const app = fastify({
    loggerInstance: logger,
    genReqId: () => crypto.randomUUID(),
    // `false` = ignore X-Forwarded-For entirely. Trusting it unconditionally would make the
    // rate limiter's IP key client-controlled; only named upstreams get to set it.
    trustProxy: container.env.TRUST_PROXY || false,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(errorHandlerPlugin);
  await app.register(cors, {
    origin: container.env.CORS_ORIGIN.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  await app.register(sensible);
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });
  await app.register(websocketPlugin);
  await app.register(
    createAuthPlugin({
      tokenService: container.tokenService,
      authenticateApiKey: container.useCases.authenticateApiKey,
    }),
  );
  await app.register(tenantContextPlugin);
  await app.register(rbacPlugin);

  await app.register(registerHealthRoutes);
  await app.register(registerMetricsRoutes(container), { prefix: '/metrics' });
  await app.register(registerAuthRoutes(container), { prefix: '/api/auth' });
  await app.register(registerTargetRoutes(container), { prefix: '/api/targets' });
  await app.register(registerCheckRoutes(container), { prefix: '/api' });
  await app.register(registerAlertRoutes(container), { prefix: '/api/alert-channels' });
  await app.register(registerApiKeyRoutes(container), { prefix: '/api/api-keys' });
  await app.register(registerWebsocketRoutes(container), { prefix: '/ws' });

  await app.register(staticPlugin, {
    root: webDistDir,
    prefix: '/',
    decorateReply: true,
    wildcard: false,
  });
  app.setNotFoundHandler((request, reply) => {
    if (request.raw.method === 'GET' && !request.url.startsWith('/api')) {
      reply.sendFile('index.html');
      return;
    }
    reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  return app;
}
