import type { AlertChannel } from '../../../domain/entities/alert-channel.entity.js';
import type { IAlertChannelRepository } from '../../../domain/repositories/alert-channel.repository.js';
import type { IAlerterFactory } from '../../ports/alerter.port.js';
import type { TargetStatusChangedEvent } from '../../ports/domain-events.js';

export interface AlertDispatchLogger {
  error(context: { channelId: string; error: unknown }, message: string): void;
}

/**
 * Fans a status-change event out to every enabled alert channel for its tenant.
 * One channel failing to deliver (e.g. Slack webhook down) never blocks the others.
 */
export class DispatchStatusChangeAlertsUseCase {
  constructor(
    private readonly alertChannels: IAlertChannelRepository,
    private readonly alerterFactory: IAlerterFactory,
    private readonly logger: AlertDispatchLogger,
  ) {}

  async execute(event: TargetStatusChangedEvent): Promise<void> {
    const channels = await this.alertChannels.listByTenant(event.tenantId);
    const enabledChannels = channels.filter((channel) => channel.enabled);

    await Promise.all(enabledChannels.map((channel) => this.dispatchTo(channel, event)));
  }

  private async dispatchTo(channel: AlertChannel, event: TargetStatusChangedEvent): Promise<void> {
    try {
      const alerter = this.alerterFactory.getAlerter(channel.type);
      await alerter.send(channel, event);
    } catch (error) {
      this.logger.error({ channelId: channel.id, error }, 'Failed to deliver alert');
    }
  }
}
