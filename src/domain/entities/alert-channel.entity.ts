export const ALERT_CHANNEL_TYPES = ['webhook', 'discord', 'slack'] as const;
export type AlertChannelType = (typeof ALERT_CHANNEL_TYPES)[number];

export interface AlertChannel {
  readonly id: string;
  readonly tenantId: string;
  readonly type: AlertChannelType;
  readonly name: string;
  readonly url: string;
  readonly enabled: boolean;
  readonly createdAt: Date;
}
