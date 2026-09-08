import type { IMailer } from '../../src/application/ports/mailer.port.js';

export class FakeMailer implements IMailer {
  readonly sent: { to: string; resetToken: string }[] = [];

  async sendPasswordReset(to: string, resetToken: string): Promise<void> {
    this.sent.push({ to, resetToken });
  }
}
