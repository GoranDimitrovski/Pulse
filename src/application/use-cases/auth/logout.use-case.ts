import type { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.js';
import type { ITokenService } from '../../ports/token-service.port.js';

export interface LogoutInput {
  readonly refreshToken: string;
}

export class LogoutUseCase {
  constructor(
    private readonly refreshTokens: IRefreshTokenRepository,
    private readonly tokenService: ITokenService,
  ) {}

  async execute(input: LogoutInput): Promise<void> {
    const tokenHash = this.tokenService.hashOpaqueToken(input.refreshToken);
    const stored = await this.refreshTokens.findByHash(tokenHash);
    if (stored) {
      await this.refreshTokens.revoke(stored.id);
    }
  }
}
