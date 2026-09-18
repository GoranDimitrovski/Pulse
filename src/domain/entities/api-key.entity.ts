import { timingSafeEqual } from 'node:crypto';

/**
 * How much of the plaintext key is kept as the lookup prefix. `key_prefix` carries a UNIQUE
 * index, so this has to be wide enough that two issued keys never collide: 'pk_' + 13 hex
 * chars is ~52 bits of entropy, where an 8-char prefix left only 20 — a birthday collision
 * (and an unhandled unique violation on create) at barely a thousand keys.
 */
export const KEY_PREFIX_LENGTH = 16;

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

/** Everything a client may see — the stored hash is not part of it. */
export type PublicApiKey = Omit<ApiKeyProps, 'keyHash'>;

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

  /** Never serialize keyHash to a client — this is the one place that decides what "public" means. */
  toPublic(): PublicApiKey {
    const { keyHash: _keyHash, ...publicKey } = this;
    return publicKey;
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
