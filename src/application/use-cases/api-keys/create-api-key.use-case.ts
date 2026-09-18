import { KEY_PREFIX_LENGTH, type ApiKey } from '../../../domain/entities/api-key.entity.js';
import type { IApiKeyRepository } from '../../../domain/repositories/api-key.repository.js';
import type { ITokenService } from '../../ports/token-service.port.js';

export interface CreateApiKeyInput {
  readonly tenantId: string;
  readonly name: string;
}

export interface CreateApiKeyResult {
  readonly apiKey: ApiKey;
  /** Shown to the caller exactly once; only its hash is persisted. */
  readonly plainTextKey: string;
}

export class CreateApiKeyUseCase {
  constructor(
    private readonly apiKeys: IApiKeyRepository,
    private readonly tokenService: ITokenService,
  ) {}

  async execute(input: CreateApiKeyInput): Promise<CreateApiKeyResult> {
    const secret = this.tokenService.generateOpaqueToken();
    const plainTextKey = `pk_${secret}`;
    const keyPrefix = plainTextKey.slice(0, KEY_PREFIX_LENGTH);

    const apiKey = await this.apiKeys.create({
      tenantId: input.tenantId,
      name: input.name,
      keyHash: this.tokenService.hashOpaqueToken(plainTextKey),
      keyPrefix,
    });

    return { apiKey, plainTextKey };
  }
}
