import type { Role } from '../entities/role.js';
import type { User } from '../entities/user.entity.js';

export interface CreateUserInput {
  readonly tenantId: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly role: Role;
}

/**
 * Email is globally unique (one account belongs to exactly one tenant).
 * ponytail: simplest auth model; upgrade to multi-tenant-membership-per-email if needed later.
 */
export interface IUserRepository {
  create(input: CreateUserInput): Promise<User>;
  findById(tenantId: string, id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  listByTenant(tenantId: string): Promise<User[]>;
  /**
   * The following are unscoped by design: both are called only after a password-reset
   * token (itself bound to a specific userId) has already identified the user.
   */
  findByIdUnscoped(userId: string): Promise<User | null>;
  updatePassword(userId: string, passwordHash: string): Promise<void>;
}
