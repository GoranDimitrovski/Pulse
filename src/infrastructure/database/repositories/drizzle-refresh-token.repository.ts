import { and, eq } from 'drizzle-orm';

import { RefreshToken } from '../../../domain/entities/refresh-token.entity.js';
import type {
  CreateRefreshTokenInput,
  IRefreshTokenRepository,
} from '../../../domain/repositories/refresh-token.repository.js';
import type { Database } from '../client.js';
import { refreshTokens } from '../schema.js';

export class DrizzleRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly db: Database) {}

  async create(input: CreateRefreshTokenInput): Promise<RefreshToken> {
    const [row] = await this.db.insert(refreshTokens).values(input).returning();
    return new RefreshToken(row!);
  }

  async findByHash(tokenHash: string): Promise<RefreshToken | null> {
    const [row] = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash))
      .limit(1);
    return row ? new RefreshToken(row) : null;
  }

  async revoke(id: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, id));
  }

  async revokeAllForUser(tenantId: string, userId: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.tenantId, tenantId), eq(refreshTokens.userId, userId)));
  }
}
