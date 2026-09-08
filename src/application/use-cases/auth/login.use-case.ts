import { UnauthorizedError } from '../../../domain/errors/domain-error.js';
import type { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.js';
import { Email } from '../../../domain/value-objects/email.js';
import type { IClock } from '../../ports/clock.port.js';
import type { IPasswordHasher } from '../../ports/password-hasher.port.js';
import type { ITokenService } from '../../ports/token-service.port.js';
import type { AuthTokens } from './auth-tokens.js';

export interface LoginInput {
  readonly email: string;
  readonly password: string;
}

export class LoginUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly refreshTokens: IRefreshTokenRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService,
    private readonly clock: IClock,
    private readonly refreshTtlMs: number,
  ) {}

  async execute(input: LoginInput): Promise<AuthTokens> {
    let email: Email;
    try {
      email = Email.create(input.email);
    } catch {
      throw new UnauthorizedError('Invalid email or password');
    }

    const user = await this.users.findByEmail(email.value);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const passwordValid = await this.passwordHasher.verify(user.passwordHash, input.password);
    if (!passwordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

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
