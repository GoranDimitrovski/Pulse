import type { AlertChannel, AlertChannelType } from '../../domain/entities/alert-channel.entity.js';
import type { TargetStatusChangedEvent } from './domain-events.js';

/** Strategy interface: one implementation per alert channel type. */
export interface IAlerter {
  readonly type: AlertChannelType;
  send(channel: AlertChannel, event: TargetStatusChangedEvent): Promise<void>;
}

export interface IAlerterFactory {
  getAlerter(type: AlertChannelType): IAlerter;
}
