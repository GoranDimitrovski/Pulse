import type { FastifyInstance } from 'fastify';
import type { WebSocket } from 'ws';

import { UnauthorizedError } from '../../../domain/errors/domain-error.js';
import type { Container } from '../../composition/container.js';

interface DashboardQuery {
  token?: string;
}

export function registerWebsocketRoutes(container: Container) {
  return async function websocketRoutes(app: FastifyInstance) {
    app.get<{ Querystring: DashboardQuery }>(
      '/dashboard',
      { websocket: true },
      async (socket: WebSocket, request) => {
        try {
          const token = request.query.token;
          if (!token) {
            throw new UnauthorizedError('Missing token');
          }
          const payload = container.tokenService.verifyAccessToken(token);
          const { tenantId } = payload;

          container.connectionManager.add(tenantId, socket);

          const snapshot = await container.useCases.getDashboardSnapshot.execute(tenantId);
          socket.send(JSON.stringify({ type: 'dashboard.snapshot', entries: snapshot }));

          socket.on('close', () => container.connectionManager.remove(tenantId, socket));
          socket.on('error', () => container.connectionManager.remove(tenantId, socket));
        } catch {
          socket.close(4001, 'Unauthorized');
        }
      },
    );
  };
}
