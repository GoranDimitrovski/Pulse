export interface RefreshTokenProps {
  readonly id: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly revokedAt: Date | null;
  readonly createdAt: Date;
}

export class RefreshToken {
  readonly id: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly revokedAt: Date | null;
  readonly createdAt: Date;

  constructor(props: RefreshTokenProps) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.userId = props.userId;
    this.tokenHash = props.tokenHash;
    this.expiresAt = props.expiresAt;
    this.revokedAt = props.revokedAt;
    this.createdAt = props.createdAt;
  }

  revoke(now: Date = new Date()): RefreshToken {
    if (this.isRevoked()) {
      return this;
    }
    return new RefreshToken({ ...this, revokedAt: now });
  }

  isRevoked(): boolean {
    return this.revokedAt !== null;
  }

  /** Not revoked, and not past its expiry, as of `now`. */
  isValid(now: Date): boolean {
    return this.revokedAt === null && this.expiresAt >= now;
  }
}
