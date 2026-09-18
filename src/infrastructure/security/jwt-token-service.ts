import { randomBytes, createHash } from 'node:crypto';

import { createSigner, createVerifier } from 'fast-jwt';

import type {
  AccessTokenPayload,
  ITokenService,
} from '../../application/ports/token-service.port.js';
import { UnauthorizedError } from '../../domain/errors/domain-error.js';
import { parseDurationMs } from '../../shared/duration.js';

export class JwtTokenService implements ITokenService {
  private readonly sign: (payload: AccessTokenPayload) => string;
  private readonly verify: (token: string) => AccessTokenPayload;

  constructor(accessSecret: string, accessTtl: string) {
    this.sign = createSigner({ key: accessSecret, expiresIn: parseDurationMs(accessTtl) });
    this.verify = createVerifier({ key: accessSecret }) as (token: string) => AccessTokenPayload;
  }

  signAccessToken(payload: AccessTokenPayload): string {
    return this.sign(payload);
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      return this.verify(token);
    } catch {
      throw new UnauthorizedError('Invalid or expired access token');
    }
  }

  generateOpaqueToken(): string {
    return randomBytes(32).toString('hex');
  }

  hashOpaqueToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
