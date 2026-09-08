import type { IPasswordHasher } from '../../src/application/ports/password-hasher.port.js';

/** Reversible fake — fast for unit tests, never use outside tests. */
export class FakePasswordHasher implements IPasswordHasher {
  async hash(plainText: string): Promise<string> {
    return `hashed:${plainText}`;
  }

  async verify(hash: string, plainText: string): Promise<boolean> {
    return hash === `hashed:${plainText}`;
  }
}
