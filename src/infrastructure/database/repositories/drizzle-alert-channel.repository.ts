import { and, eq } from 'drizzle-orm';

import { AlertChannel } from '../../../domain/entities/alert-channel.entity.js';
import type {
  CreateAlertChannelInput,
  IAlertChannelRepository,
} from '../../../domain/repositories/alert-channel.repository.js';
import type { Database } from '../client.js';
import { alertChannels } from '../schema.js';

export class DrizzleAlertChannelRepository implements IAlertChannelRepository {
  constructor(private readonly db: Database) {}

  async create(input: CreateAlertChannelInput): Promise<AlertChannel> {
    const [row] = await this.db.insert(alertChannels).values(input).returning();
    return new AlertChannel(row!);
  }

  async listByTenant(tenantId: string): Promise<AlertChannel[]> {
    return this.db
      .select()
      .from(alertChannels)
      .where(eq(alertChannels.tenantId, tenantId))
      .then((rows) => rows.map((row) => new AlertChannel(row)));
  }

  async listAllEnabled(): Promise<AlertChannel[]> {
    return this.db
      .select()
      .from(alertChannels)
      .where(eq(alertChannels.enabled, true))
      .then((rows) => rows.map((row) => new AlertChannel(row)));
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    const result = await this.db
      .delete(alertChannels)
      .where(and(eq(alertChannels.tenantId, tenantId), eq(alertChannels.id, id)))
      .returning({ id: alertChannels.id });
    return result.length > 0;
  }
}
