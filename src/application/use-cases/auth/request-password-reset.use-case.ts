import type { IPasswordResetTokenRepository } from '../../../domain/repositories/password-reset-token.repository.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.js';
import { Email } from '../../../domain/value-objects/email.js';
import type { IClock } from '../../ports/clock.port.js';
import type { IMailer } from '../../ports/mailer.port.js';
import type { ITokenService } from '../../ports/token-service.port.js';

export interface RequestPasswordResetInput {
  readonly email: string;
}

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export class RequestPasswordResetUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly resetTokens: IPasswordResetTokenRepository,
    private readonly tokenService: ITokenService,
    private readonly mailer: IMailer,
    private readonly clock: IClock,
  ) {}

  /** Always succeeds silently for unknown or malformed emails, to avoid leaking account existence. */
  async execute(input: RequestPasswordResetInput): Promise<void> {
    let email: Email;
    try {
      email = Email.create(input.email);
    } catch {
      return;
    }

    const user = await this.users.findByEmail(email.value);
    if (!user) {
      return;
    }

    const resetToken = this.tokenService.generateOpaqueToken();
    await this.resetTokens.create({
      userId: user.id,
      tokenHash: this.tokenService.hashOpaqueToken(resetToken),
      expiresAt: new Date(this.clock.now().getTime() + RESET_TOKEN_TTL_MS),
    });

    await this.mailer.sendPasswordReset(user.email, resetToken);
  }
}
