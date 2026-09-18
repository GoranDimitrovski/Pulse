import type { IAlerter } from '../../application/ports/alerter.port.js';
import type { AlertChannel } from '../../domain/entities/alert-channel.entity.js';
import type { TargetStatusChangedEvent } from '../../domain/events/domain-events.js';
import { postJson } from './post-json.js';

export class DiscordAlerter implements IAlerter {
  readonly type = 'discord' as const;

  async send(channel: AlertChannel, event: TargetStatusChangedEvent): Promise<void> {
    const emoji =
      event.currentStatus === 'up' ? '✅' : event.currentStatus === 'down' ? '🔴' : '⚠️';
    await postJson(channel.url, {
      content: `${emoji} **${event.targetName}** is now **${event.currentStatus.toUpperCase()}**${
        event.result.message ? ` — ${event.result.message}` : ''
      }`,
    });
  }
}
