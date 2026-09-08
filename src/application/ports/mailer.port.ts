export interface IMailer {
  sendPasswordReset(to: string, resetToken: string): Promise<void>;
}
