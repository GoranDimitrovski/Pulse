import { and, eq } from 'drizzle-orm';

import { ApiKey } from '../../../domain/entities/api-key.entity.js';
import type {
  CreateApiKeyInput,
  IApiKeyRepository,
} from '../../../domain/repositories/api-key.repository.js';
import type { Database } from '../client.js';
import { apiKeys } from '../schema.js';

export class DrizzleApiKeyRepository implements IApiKeyRepository {
  constructor(private readonly db: Database) {}

  async create(input: CreateApiKeyInput): Promise<ApiKey> {
    const [row] = await this.db.insert(apiKeys).values(input).returning();
    return new ApiKey(row!);
  }

  async findByPrefix(keyPrefix: string): Promise<ApiKey | null> {
    const [row] = await this.db.select().from(apiKeys).where(eq(apiKeys.keyPrefix, keyPrefix)).limit(1);
    return row ? new ApiKey(row) : null;
  }

  async listByTenant(tenantId: string): Promise<ApiKey[]> {
    const rows = await this.db.select().from(apiKeys).where(eq(apiKeys.tenantId, tenantId));
    return rows.map((row) => new ApiKey(row));
  }

  async revoke(tenantId: string, id: string): Promise<boolean> {
    const result = await this.db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(and(eq(apiKeys.tenantId, tenantId), eq(apiKeys.id, id)))
      .returning({ id: apiKeys.id });
    return result.length > 0;
  }

  async touchLastUsed(id: string): Promise<void> {
    await this.db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, id));
  }
}
