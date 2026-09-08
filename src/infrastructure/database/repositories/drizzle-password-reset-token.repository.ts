import { eq } from 'drizzle-orm';

import { PasswordResetToken } from '../../../domain/entities/password-reset-token.entity.js';
import type {
  CreatePasswordResetTokenInput,
  IPasswordResetTokenRepository,
} from '../../../domain/repositories/password-reset-token.repository.js';
import type { Database } from '../client.js';
import { passwordResetTokens } from '../schema.js';

export class DrizzlePasswordResetTokenRepository implements IPasswordResetTokenRepository {
  constructor(private readonly db: Database) {}

  async create(input: CreatePasswordResetTokenInput): Promise<PasswordResetToken> {
    const [row] = await this.db.insert(passwordResetTokens).values(input).returning();
    return new PasswordResetToken(row!);
  }

  async findByHash(tokenHash: string): Promise<PasswordResetToken | null> {
    const [row] = await this.db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.tokenHash, tokenHash))
      .limit(1);
    return row ? new PasswordResetToken(row) : null;
  }

  async markUsed(id: string): Promise<void> {
    await this.db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, id));
  }
}
