import type { AlertChannel, AlertChannelType } from '../entities/alert-channel.entity.js';

export interface CreateAlertChannelInput {
  readonly tenantId: string;
  readonly type: AlertChannelType;
  readonly name: string;
  readonly url: string;
  readonly enabled: boolean;
}

export interface IAlertChannelRepository {
  create(input: CreateAlertChannelInput): Promise<AlertChannel>;
  listByTenant(tenantId: string): Promise<AlertChannel[]>;
  listAllEnabled(): Promise<AlertChannel[]>;
  delete(tenantId: string, id: string): Promise<boolean>;
}
