import type { ApiKey } from '../entities/api-key.entity.js';

export interface CreateApiKeyInput {
  readonly tenantId: string;
  readonly name: string;
  readonly keyHash: string;
  readonly keyPrefix: string;
}

export interface IApiKeyRepository {
  create(input: CreateApiKeyInput): Promise<ApiKey>;
  findByPrefix(keyPrefix: string): Promise<ApiKey | null>;
  listByTenant(tenantId: string): Promise<ApiKey[]>;
  revoke(tenantId: string, id: string): Promise<boolean>;
  touchLastUsed(id: string): Promise<void>;
}
