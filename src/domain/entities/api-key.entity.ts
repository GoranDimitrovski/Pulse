import { timingSafeEqual } from 'node:crypto';

export interface ApiKeyProps {
  readonly id: string;
  readonly tenantId: string;
  readonly name: string;
  readonly keyHash: string;
  readonly keyPrefix: string;
  readonly lastUsedAt: Date | null;
  readonly revokedAt: Date | null;
  readonly createdAt: Date;
}

export class ApiKey {
  readonly id: string;
  readonly tenantId: string;
  readonly name: string;
  readonly keyHash: string;
  readonly keyPrefix: string;
  readonly lastUsedAt: Date | null;
  readonly revokedAt: Date | null;
  readonly createdAt: Date;

  constructor(props: ApiKeyProps) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.name = props.name;
    this.keyHash = props.keyHash;
    this.keyPrefix = props.keyPrefix;
    this.lastUsedAt = props.lastUsedAt;
    this.revokedAt = props.revokedAt;
    this.createdAt = props.createdAt;
  }

  isRevoked(): boolean {
    return this.revokedAt !== null;
  }

  /**
   * Constant-time comparison against an already-hashed candidate. Hashing itself stays
   * a use-case concern (it goes through the swappable ITokenService port); this only
   * owns the "do these two hashes match" comparison, which is a fixed rule of the entity
   * regardless of which hashing algorithm produced them.
   */
  matchesHash(candidateHash: string): boolean {
    const presented = Buffer.from(candidateHash);
    const stored = Buffer.from(this.keyHash);
    return presented.length === stored.length && timingSafeEqual(presented, stored);
  }
}
