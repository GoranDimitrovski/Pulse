import type { IAlerter } from '../../application/ports/alerter.port.js';
import type { TargetStatusChangedEvent } from '../../application/ports/domain-events.js';
import type { AlertChannel } from '../../domain/entities/alert-channel.entity.js';

export class DiscordAlerter implements IAlerter {
  readonly type = 'discord' as const;

  async send(channel: AlertChannel, event: TargetStatusChangedEvent): Promise<void> {
    const emoji = event.currentStatus === 'up' ? '✅' : event.currentStatus === 'down' ? '🔴' : '⚠️';
    await fetch(channel.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        content: `${emoji} **${event.targetName}** is now **${event.currentStatus.toUpperCase()}**${
          event.result.message ? ` — ${event.result.message}` : ''
        }`,
      }),
    });
  }
}
