import type { PasswordResetToken } from '../entities/password-reset-token.entity.js';

export interface CreatePasswordResetTokenInput {
  readonly tenantId: string;
  readonly userId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
}

export interface IPasswordResetTokenRepository {
  create(input: CreatePasswordResetTokenInput): Promise<PasswordResetToken>;
  /**
   * Unscoped by necessity — the presented token hash is the only thing the caller has, and
   * it's what identifies the tenant. The returned token carries `tenantId`, so every read
   * after this one is scoped. Same shape as IRefreshTokenRepository.findByHash.
   */
  findByHash(tokenHash: string): Promise<PasswordResetToken | null>;
  markUsed(tenantId: string, id: string): Promise<void>;
}
