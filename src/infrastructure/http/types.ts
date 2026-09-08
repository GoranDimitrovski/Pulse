import type { Role } from '../../domain/entities/role.js';

export interface AuthUser {
  readonly tenantId: string;
  readonly userId: string;
  readonly role: Role;
}

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: AuthUser;
  }
}
