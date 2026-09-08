import type { ApiKey } from '../../../domain/entities/api-key.entity.js';
import type { IApiKeyRepository } from '../../../domain/repositories/api-key.repository.js';

export class ListApiKeysUseCase {
  constructor(private readonly apiKeys: IApiKeyRepository) {}

  async execute(tenantId: string): Promise<ApiKey[]> {
    return this.apiKeys.listByTenant(tenantId);
  }
}
