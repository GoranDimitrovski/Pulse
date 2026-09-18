import { ValidationError } from '../errors/domain-error.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email {
  private constructor(readonly value: string) {}

  static create(raw: string): Email {
    const normalized = raw.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalized)) {
      throw new ValidationError(`'${raw}' is not a valid email address`);
    }
    return new Email(normalized);
  }
}
