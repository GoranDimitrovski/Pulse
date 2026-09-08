import type { RefreshToken } from '../entities/refresh-token.entity.js';

export interface CreateRefreshTokenInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
}

export interface IRefreshTokenRepository {
  create(input: CreateRefreshTokenInput): Promise<RefreshToken>;
  findByHash(tokenHash: string): Promise<RefreshToken | null>;
  revoke(id: string): Promise<void>;
  revokeAllForUser(tenantId: string, userId: string): Promise<void>;
}
