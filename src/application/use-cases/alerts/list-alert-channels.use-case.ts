import type { AlertChannel } from '../../../domain/entities/alert-channel.entity.js';
import type { IAlertChannelRepository } from '../../../domain/repositories/alert-channel.repository.js';

export class ListAlertChannelsUseCase {
  constructor(private readonly alertChannels: IAlertChannelRepository) {}

  async execute(tenantId: string): Promise<AlertChannel[]> {
    return this.alertChannels.listByTenant(tenantId);
  }
}
