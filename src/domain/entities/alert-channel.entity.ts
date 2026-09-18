export const ALERT_CHANNEL_TYPES = ['webhook', 'discord', 'slack'] as const;
export type AlertChannelType = (typeof ALERT_CHANNEL_TYPES)[number];

export interface AlertChannelProps {
  readonly id: string;
  readonly tenantId: string;
  readonly type: AlertChannelType;
  readonly name: string;
  readonly url: string;
  readonly enabled: boolean;
  readonly createdAt: Date;
}

export class AlertChannel {
  readonly id: string;
  readonly tenantId: string;
  readonly type: AlertChannelType;
  readonly name: string;
  readonly url: string;
  readonly enabled: boolean;
  readonly createdAt: Date;

  constructor(props: AlertChannelProps) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.type = props.type;
    this.name = props.name;
    this.url = props.url;
    this.enabled = props.enabled;
    this.createdAt = props.createdAt;
  }
}
