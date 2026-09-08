import { randomUUID } from 'node:crypto';

import type { AlertChannel } from '../../src/domain/entities/alert-channel.entity.js';
import type {
  CreateAlertChannelInput,
  IAlertChannelRepository,
} from '../../src/domain/repositories/alert-channel.repository.js';

export class InMemoryAlertChannelRepository implements IAlertChannelRepository {
  readonly channels: AlertChannel[] = [];

  async create(input: CreateAlertChannelInput): Promise<AlertChannel> {
    const channel: AlertChannel = { id: randomUUID(), createdAt: new Date(), ...input };
    this.channels.push(channel);
    return channel;
  }

  async listByTenant(tenantId: string): Promise<AlertChannel[]> {
    return this.channels.filter((c) => c.tenantId === tenantId);
  }

  async listAllEnabled(): Promise<AlertChannel[]> {
    return this.channels.filter((c) => c.enabled);
  }

  async delete(tenantId: string, id: string): Promise<boolean> {
    const index = this.channels.findIndex((c) => c.tenantId === tenantId && c.id === id);
    if (index === -1) return false;
    this.channels.splice(index, 1);
    return true;
  }
}
