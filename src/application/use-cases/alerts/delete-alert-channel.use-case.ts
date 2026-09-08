import { NotFoundError } from '../../../domain/errors/domain-error.js';
import type { IAlertChannelRepository } from '../../../domain/repositories/alert-channel.repository.js';

export class DeleteAlertChannelUseCase {
  constructor(private readonly alertChannels: IAlertChannelRepository) {}

  async execute(tenantId: string, id: string): Promise<void> {
    const deleted = await this.alertChannels.delete(tenantId, id);
    if (!deleted) {
      throw new NotFoundError('Alert channel', id);
    }
  }
}
