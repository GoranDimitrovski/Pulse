import * as argon2 from 'argon2';

import type { IPasswordHasher } from '../../application/ports/password-hasher.port.js';

export class Argon2PasswordHasher implements IPasswordHasher {
  async hash(plainText: string): Promise<string> {
    return argon2.hash(plainText, { type: argon2.argon2id });
  }

  async verify(hash: string, plainText: string): Promise<boolean> {
    return argon2.verify(hash, plainText);
  }
}
