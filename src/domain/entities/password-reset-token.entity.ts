export interface PasswordResetTokenProps {
  readonly id: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly usedAt: Date | null;
  readonly createdAt: Date;
}

export class PasswordResetToken {
  readonly id: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly usedAt: Date | null;
  readonly createdAt: Date;

  constructor(props: PasswordResetTokenProps) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.userId = props.userId;
    this.tokenHash = props.tokenHash;
    this.expiresAt = props.expiresAt;
    this.usedAt = props.usedAt;
    this.createdAt = props.createdAt;
  }

  markUsed(now: Date = new Date()): PasswordResetToken {
    if (this.usedAt !== null) {
      return this;
    }
    return new PasswordResetToken({ ...this, usedAt: now });
  }

  /** Not already used, and not past its expiry, as of `now`. */
  isValid(now: Date): boolean {
    return this.usedAt === null && this.expiresAt >= now;
  }
}
