import type { IAlerter } from '../../application/ports/alerter.port.js';
import type { AlertChannel } from '../../domain/entities/alert-channel.entity.js';
import type { TargetStatusChangedEvent } from '../../domain/events/domain-events.js';
import { postJson } from './post-json.js';

export class WebhookAlerter implements IAlerter {
  readonly type = 'webhook' as const;

  async send(channel: AlertChannel, event: TargetStatusChangedEvent): Promise<void> {
    await postJson(channel.url, {
      targetId: event.targetId,
      targetName: event.targetName,
      previousStatus: event.previousStatus,
      currentStatus: event.currentStatus,
      message: event.result.message,
      checkedAt: event.result.checkedAt,
    });
  }
}
