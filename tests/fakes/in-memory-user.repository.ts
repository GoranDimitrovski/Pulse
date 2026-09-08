import { randomUUID } from 'node:crypto';

import { User } from '../../src/domain/entities/user.entity.js';
import type {
  CreateUserInput,
  IUserRepository,
} from '../../src/domain/repositories/user.repository.js';

export class InMemoryUserRepository implements IUserRepository {
  readonly users: User[] = [];

  async create(input: CreateUserInput): Promise<User> {
    const user = new User({ id: randomUUID(), createdAt: new Date(), ...input });
    this.users.push(user);
    return user;
  }

  async findById(tenantId: string, id: string): Promise<User | null> {
    return this.users.find((u) => u.tenantId === tenantId && u.id === id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((u) => u.email === email) ?? null;
  }

  async findByIdUnscoped(userId: string): Promise<User | null> {
    return this.users.find((u) => u.id === userId) ?? null;
  }

  async listByTenant(tenantId: string): Promise<User[]> {
    return this.users.filter((u) => u.tenantId === tenantId);
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    const index = this.users.findIndex((u) => u.id === userId);
    if (index !== -1) {
      this.users[index] = new User({ ...this.users[index]!, passwordHash });
    }
  }
}
