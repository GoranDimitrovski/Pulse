import type { Role } from '../../domain/entities/role.js';

export interface AccessTokenPayload {
  readonly sub: string;
  readonly tenantId: string;
  readonly role: Role;
}

export interface ITokenService {
  signAccessToken(payload: AccessTokenPayload): string;
  verifyAccessToken(token: string): AccessTokenPayload;
  /** High-entropy opaque string for refresh tokens (not a JWT, so it can be revoked server-side). */
  generateOpaqueToken(): string;
  hashOpaqueToken(token: string): string;
}
