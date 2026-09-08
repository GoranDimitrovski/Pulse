import type { IAlerter, IAlerterFactory } from '../../application/ports/alerter.port.js';
import type { AlertChannelType } from '../../domain/entities/alert-channel.entity.js';

export class AlerterFactory implements IAlerterFactory {
  private readonly alerters: ReadonlyMap<AlertChannelType, IAlerter>;

  constructor(alerters: readonly IAlerter[]) {
    this.alerters = new Map(alerters.map((alerter) => [alerter.type, alerter]));
  }

  getAlerter(type: AlertChannelType): IAlerter {
    const alerter = this.alerters.get(type);
    if (!alerter) {
      throw new Error(`No alerter registered for type '${type}'`);
    }
    return alerter;
  }
}
