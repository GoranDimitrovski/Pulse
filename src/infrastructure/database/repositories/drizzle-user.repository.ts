import { and, eq } from 'drizzle-orm';

import { User } from '../../../domain/entities/user.entity.js';
import type {
  CreateUserInput,
  IUserRepository,
} from '../../../domain/repositories/user.repository.js';
import type { Database } from '../client.js';
import { users } from '../schema.js';

export class DrizzleUserRepository implements IUserRepository {
  constructor(private readonly db: Database) {}

  async create(input: CreateUserInput): Promise<User> {
    const [row] = await this.db.insert(users).values(input).returning();
    return new User(row!);
  }

  async findById(tenantId: string, id: string): Promise<User | null> {
    const [row] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.tenantId, tenantId), eq(users.id, id)))
      .limit(1);
    return row ? new User(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [row] = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return row ? new User(row) : null;
  }

  async updatePassword(tenantId: string, userId: string, passwordHash: string): Promise<void> {
    await this.db
      .update(users)
      .set({ passwordHash })
      .where(and(eq(users.tenantId, tenantId), eq(users.id, userId)));
  }
}
