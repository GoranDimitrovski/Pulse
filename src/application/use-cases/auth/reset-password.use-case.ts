import { UnauthorizedError } from '../../../domain/errors/domain-error.js';
import type { IPasswordResetTokenRepository } from '../../../domain/repositories/password-reset-token.repository.js';
import type { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.js';
import type { IClock } from '../../ports/clock.port.js';
import type { IPasswordHasher } from '../../ports/password-hasher.port.js';
import type { ITokenService } from '../../ports/token-service.port.js';

export interface ResetPasswordInput {
  readonly resetToken: string;
  readonly newPassword: string;
}

export class ResetPasswordUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly resetTokens: IPasswordResetTokenRepository,
    private readonly refreshTokens: IRefreshTokenRepository,
    private readonly tokenService: ITokenService,
    private readonly passwordHasher: IPasswordHasher,
    private readonly clock: IClock,
  ) {}

  async execute(input: ResetPasswordInput): Promise<void> {
    const tokenHash = this.tokenService.hashOpaqueToken(input.resetToken);
    const stored = await this.resetTokens.findByHash(tokenHash);

    if (!stored || !stored.isValid(this.clock.now())) {
      throw new UnauthorizedError('Invalid or expired reset token');
    }

    const user = await this.users.findByIdUnscoped(stored.userId);
    if (!user) {
      throw new UnauthorizedError('Invalid or expired reset token');
    }

    const passwordHash = await this.passwordHasher.hash(input.newPassword);
    await this.users.updatePassword(user.id, passwordHash);
    await this.resetTokens.markUsed(stored.id);
    await this.refreshTokens.revokeAllForUser(user.tenantId, user.id);
  }
}
