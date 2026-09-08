import type { ApiKey } from '../../../domain/entities/api-key.entity.js';
import type { IApiKeyRepository } from '../../../domain/repositories/api-key.repository.js';
import type { ITokenService } from '../../ports/token-service.port.js';

const KEY_PREFIX_LENGTH = 8;

export class AuthenticateApiKeyUseCase {
  constructor(
    private readonly apiKeys: IApiKeyRepository,
    private readonly tokenService: ITokenService,
  ) {}

  async execute(plainTextKey: string): Promise<ApiKey | null> {
    const prefix = plainTextKey.slice(0, KEY_PREFIX_LENGTH);
    const candidate = await this.apiKeys.findByPrefix(prefix);
    if (!candidate || candidate.isRevoked()) {
      return null;
    }

    const candidateHash = this.tokenService.hashOpaqueToken(plainTextKey);
    if (!candidate.matchesHash(candidateHash)) {
      return null;
    }

    await this.apiKeys.touchLastUsed(candidate.id);
    return candidate;
  }
}
