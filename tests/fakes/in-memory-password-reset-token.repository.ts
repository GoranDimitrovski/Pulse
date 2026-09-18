import { randomUUID } from 'node:crypto';

import { PasswordResetToken } from '../../src/domain/entities/password-reset-token.entity.js';
import type {
  CreatePasswordResetTokenInput,
  IPasswordResetTokenRepository,
} from '../../src/domain/repositories/password-reset-token.repository.js';

export class InMemoryPasswordResetTokenRepository implements IPasswordResetTokenRepository {
  readonly tokens: PasswordResetToken[] = [];

  async create(input: CreatePasswordResetTokenInput): Promise<PasswordResetToken> {
    const token = new PasswordResetToken({
      id: randomUUID(),
      usedAt: null,
      createdAt: new Date(),
      ...input,
    });
    this.tokens.push(token);
    return token;
  }

  async findByHash(tokenHash: string): Promise<PasswordResetToken | null> {
    return this.tokens.find((t) => t.tokenHash === tokenHash) ?? null;
  }

  async markUsed(tenantId: string, id: string): Promise<void> {
    const index = this.tokens.findIndex((t) => t.tenantId === tenantId && t.id === id);
    if (index !== -1) {
      this.tokens[index] = new PasswordResetToken({ ...this.tokens[index]!, usedAt: new Date() });
    }
  }
}
