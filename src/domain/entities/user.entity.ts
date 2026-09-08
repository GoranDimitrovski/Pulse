import type { Role } from './role.js';

export interface UserProps {
  readonly id: string;
  readonly tenantId: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly role: Role;
  readonly createdAt: Date;
}

export type PublicUser = Omit<UserProps, 'passwordHash'>;

export class User {
  readonly id: string;
  readonly tenantId: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly role: Role;
  readonly createdAt: Date;

  constructor(props: UserProps) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.role = props.role;
    this.createdAt = props.createdAt;
  }

  /** Never serialize passwordHash to a client — this is the one place that decides what "public" means. */
  toPublic(): PublicUser {
    const { passwordHash: _passwordHash, ...publicUser } = this;
    return publicUser;
  }
}
