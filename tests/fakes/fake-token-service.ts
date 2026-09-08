import { randomUUID } from 'node:crypto';

import type {
  AccessTokenPayload,
  ITokenService,
} from '../../src/application/ports/token-service.port.js';

export class FakeTokenService implements ITokenService {
  signAccessToken(payload: AccessTokenPayload): string {
    return `access:${JSON.stringify(payload)}`;
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    return JSON.parse(token.replace('access:', '')) as AccessTokenPayload;
  }

  generateOpaqueToken(): string {
    return randomUUID();
  }

  hashOpaqueToken(token: string): string {
    return `hashed:${token}`;
  }
}
