import type {
  AlertChannel,
  AlertChannelType,
} from '../../../domain/entities/alert-channel.entity.js';
import type { IAlertChannelRepository } from '../../../domain/repositories/alert-channel.repository.js';

export interface CreateAlertChannelInput {
  readonly tenantId: string;
  readonly type: AlertChannelType;
  readonly name: string;
  readonly url: string;
  readonly enabled: boolean;
}

export class CreateAlertChannelUseCase {
  constructor(private readonly alertChannels: IAlertChannelRepository) {}

  async execute(input: CreateAlertChannelInput): Promise<AlertChannel> {
    return this.alertChannels.create(input);
  }
}
