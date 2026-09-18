import type { Role } from './role.js';

export interface UserProps {
  readonly id: string;
  readonly tenantId: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly role: Role;
  readonly createdAt: Date;
}

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

  changePasswordHash(passwordHash: string): User {
    return new User({ ...this, passwordHash });
  }
}
