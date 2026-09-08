import type { IAlerter } from '../../application/ports/alerter.port.js';
import type { TargetStatusChangedEvent } from '../../application/ports/domain-events.js';
import type { AlertChannel } from '../../domain/entities/alert-channel.entity.js';

export class WebhookAlerter implements IAlerter {
  readonly type = 'webhook' as const;

  async send(channel: AlertChannel, event: TargetStatusChangedEvent): Promise<void> {
    await fetch(channel.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        targetId: event.targetId,
        targetName: event.targetName,
        previousStatus: event.previousStatus,
        currentStatus: event.currentStatus,
        message: event.result.message,
        checkedAt: event.result.checkedAt,
      }),
    });
  }
}
