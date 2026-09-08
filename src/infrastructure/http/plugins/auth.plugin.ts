import type { FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

import type { AuthenticateApiKeyUseCase } from '../../../application/use-cases/api-keys/authenticate-api-key.use-case.js';
import type { ITokenService } from '../../../application/ports/token-service.port.js';
import { UnauthorizedError } from '../../../domain/errors/domain-error.js';
import type { AuthUser } from '../types.js';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export interface AuthPluginDeps {
  readonly tokenService: ITokenService;
  readonly authenticateApiKey: AuthenticateApiKeyUseCase;
}

/**
 * Resolves the caller's identity from a Bearer JWT or an X-API-Key header and attaches it
 * to `request.authUser`. Never trusts a tenantId/userId supplied in the request body or
 * params — the only source of truth is the verified token/key.
 */
export function createAuthPlugin(deps: AuthPluginDeps) {
  return fp(async (app) => {
    app.decorate('authenticate', async (request: FastifyRequest, _reply: FastifyReply) => {
      const authUser = await resolveAuthUser(request, deps);
      if (!authUser) {
        throw new UnauthorizedError();
      }
      request.authUser = authUser;
    });
  });
}

async function resolveAuthUser(
  request: FastifyRequest,
  deps: AuthPluginDeps,
): Promise<AuthUser | null> {
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length);
    const payload = deps.tokenService.verifyAccessToken(token);
    return { tenantId: payload.tenantId, userId: payload.sub, role: payload.role };
  }

  const apiKeyHeader = request.headers['x-api-key'];
  const apiKey = Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader;
  if (apiKey) {
    const record = await deps.authenticateApiKey.execute(apiKey);
    if (!record) return null;
    // ponytail: API keys carry a fixed 'member' role; add per-key scopes if finer-grained
    // programmatic permissions are needed later.
    return { tenantId: record.tenantId, userId: record.id, role: 'member' };
  }

  return null;
}
