import { UnauthorizedError } from '../../../domain/errors/domain-error.js';
import type { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.js';
import type { IClock } from '../../ports/clock.port.js';
import type { ITokenService } from '../../ports/token-service.port.js';
import type { AuthTokens } from './auth-tokens.js';

export interface RefreshSessionInput {
  readonly refreshToken: string;
}

/**
 * Rotates refresh tokens on every use: the presented token is revoked and a fresh one
 * issued, so a stolen-and-replayed token is detected the moment the legitimate owner
 * (or the thief) uses it a second time.
 */
export class RefreshSessionUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly refreshTokens: IRefreshTokenRepository,
    private readonly tokenService: ITokenService,
    private readonly clock: IClock,
    private readonly refreshTtlMs: number,
  ) {}

  async execute(input: RefreshSessionInput): Promise<AuthTokens> {
    const tokenHash = this.tokenService.hashOpaqueToken(input.refreshToken);
    const stored = await this.refreshTokens.findByHash(tokenHash);

    if (!stored || !stored.isValid(this.clock.now())) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await this.users.findById(stored.tenantId, stored.userId);
    if (!user) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    await this.refreshTokens.revoke(stored.id);

    const accessToken = this.tokenService.signAccessToken({
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
    });

    const refreshToken = this.tokenService.generateOpaqueToken();
    await this.refreshTokens.create({
      tenantId: user.tenantId,
      userId: user.id,
      tokenHash: this.tokenService.hashOpaqueToken(refreshToken),
      expiresAt: new Date(this.clock.now().getTime() + this.refreshTtlMs),
    });

    return { accessToken, refreshToken };
  }
}
