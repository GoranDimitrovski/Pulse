import { randomUUID } from 'node:crypto';

import { RefreshToken } from '../../src/domain/entities/refresh-token.entity.js';
import type {
  CreateRefreshTokenInput,
  IRefreshTokenRepository,
} from '../../src/domain/repositories/refresh-token.repository.js';

export class InMemoryRefreshTokenRepository implements IRefreshTokenRepository {
  readonly tokens: RefreshToken[] = [];

  async create(input: CreateRefreshTokenInput): Promise<RefreshToken> {
    const token = new RefreshToken({ id: randomUUID(), revokedAt: null, createdAt: new Date(), ...input });
    this.tokens.push(token);
    return token;
  }

  async findByHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.tokens.find((t) => t.tokenHash === tokenHash) ?? null;
  }

  async revoke(id: string): Promise<void> {
    const index = this.tokens.findIndex((t) => t.id === id);
    if (index !== -1) {
      this.tokens[index] = new RefreshToken({ ...this.tokens[index]!, revokedAt: new Date() });
    }
  }

  async revokeAllForUser(tenantId: string, userId: string): Promise<void> {
    this.tokens.forEach((token, index) => {
      if (token.tenantId === tenantId && token.userId === userId) {
        this.tokens[index] = new RefreshToken({ ...token, revokedAt: new Date() });
      }
    });
  }
}
