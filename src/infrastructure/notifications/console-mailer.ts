import type { IMailer } from '../../application/ports/mailer.port.js';
import type { Logger } from '../logging/logger.js';

/**
 * Logs the reset link instead of integrating a real SMTP/email provider.
 * Swap for a real IMailer implementation (SES, Postmark, etc.) when going to production email.
 */
export class ConsoleMailer implements IMailer {
  constructor(private readonly logger: Logger) {}

  async sendPasswordReset(to: string, resetToken: string): Promise<void> {
    this.logger.info(
      { to, resetToken },
      'Password reset requested (email delivery not configured)',
    );
    await Promise.resolve();
  }
}
