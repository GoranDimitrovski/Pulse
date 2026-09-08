import type { PasswordResetToken } from '../entities/password-reset-token.entity.js';

export interface CreatePasswordResetTokenInput {
  readonly userId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
}

export interface IPasswordResetTokenRepository {
  create(input: CreatePasswordResetTokenInput): Promise<PasswordResetToken>;
  findByHash(tokenHash: string): Promise<PasswordResetToken | null>;
  markUsed(id: string): Promise<void>;
}
