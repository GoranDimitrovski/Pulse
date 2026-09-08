import { NotFoundError } from '../../../domain/errors/domain-error.js';
import type { IApiKeyRepository } from '../../../domain/repositories/api-key.repository.js';

export class RevokeApiKeyUseCase {
  constructor(private readonly apiKeys: IApiKeyRepository) {}

  async execute(tenantId: string, id: string): Promise<void> {
    const revoked = await this.apiKeys.revoke(tenantId, id);
    if (!revoked) {
      throw new NotFoundError('API key', id);
    }
  }
}
