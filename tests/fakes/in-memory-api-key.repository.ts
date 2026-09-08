import { randomUUID } from 'node:crypto';

import { ApiKey } from '../../src/domain/entities/api-key.entity.js';
import type {
  CreateApiKeyInput,
  IApiKeyRepository,
} from '../../src/domain/repositories/api-key.repository.js';

export class InMemoryApiKeyRepository implements IApiKeyRepository {
  readonly keys: ApiKey[] = [];

  async create(input: CreateApiKeyInput): Promise<ApiKey> {
    const key = new ApiKey({
      id: randomUUID(),
      lastUsedAt: null,
      revokedAt: null,
      createdAt: new Date(),
      ...input,
    });
    this.keys.push(key);
    return key;
  }

  async findByPrefix(keyPrefix: string): Promise<ApiKey | null> {
    return this.keys.find((k) => k.keyPrefix === keyPrefix) ?? null;
  }

  async listByTenant(tenantId: string): Promise<ApiKey[]> {
    return this.keys.filter((k) => k.tenantId === tenantId);
  }

  async revoke(tenantId: string, id: string): Promise<boolean> {
    const index = this.keys.findIndex((k) => k.tenantId === tenantId && k.id === id);
    if (index === -1) return false;
    this.keys[index] = new ApiKey({ ...this.keys[index]!, revokedAt: new Date() });
    return true;
  }

  async touchLastUsed(id: string): Promise<void> {
    const index = this.keys.findIndex((k) => k.id === id);
    if (index !== -1) {
      this.keys[index] = new ApiKey({ ...this.keys[index]!, lastUsedAt: new Date() });
    }
  }
}
