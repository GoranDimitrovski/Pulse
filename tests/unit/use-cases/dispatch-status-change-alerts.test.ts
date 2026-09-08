import { describe, expect, it } from 'vitest';

import type { IAlerter, IAlerterFactory } from '../../../src/application/ports/alerter.port.js';
import type { TargetStatusChangedEvent } from '../../../src/application/ports/domain-events.js';
import { DispatchStatusChangeAlertsUseCase } from '../../../src/application/use-cases/alerts/dispatch-status-change-alerts.use-case.js';
import type { AlertChannel, AlertChannelType } from '../../../src/domain/entities/alert-channel.entity.js';
import { InMemoryAlertChannelRepository } from '../../fakes/in-memory-alert-channel.repository.js';

class RecordingAlerter implements IAlerter {
  readonly sent: AlertChannel[] = [];

  constructor(
    readonly type: AlertChannelType,
    private readonly shouldFail = false,
  ) {}

  async send(channel: AlertChannel): Promise<void> {
    if (this.shouldFail) {
      throw new Error(`${this.type} delivery failed`);
    }
    this.sent.push(channel);
  }
}

class MapAlerterFactory implements IAlerterFactory {
  constructor(private readonly alerters: Map<AlertChannelType, IAlerter>) {}

  getAlerter(type: AlertChannelType): IAlerter {
    const alerter = this.alerters.get(type);
    if (!alerter) throw new Error(`no alerter for ${type}`);
    return alerter;
  }
}

function makeEvent(tenantId: string): TargetStatusChangedEvent {
  return {
    tenantId,
    targetId: 'target-1',
    targetName: 'Example',
    previousStatus: 'up',
    currentStatus: 'down',
    result: {
      id: 'result-1',
      tenantId,
      targetId: 'target-1',
      status: 'down',
      latencyMs: null,
      message: 'timed out',
      checkedAt: new Date(),
    },
  } as TargetStatusChangedEvent;
}

describe('DispatchStatusChangeAlertsUseCase', () => {
  it('dispatches only to enabled channels for the event tenant', async () => {
    const alertChannels = new InMemoryAlertChannelRepository();
    await alertChannels.create({
      tenantId: 'tenant-1',
      type: 'webhook',
      name: 'enabled',
      url: 'https://example.com/hook',
      enabled: true,
    });
    await alertChannels.create({
      tenantId: 'tenant-1',
      type: 'slack',
      name: 'disabled',
      url: 'https://example.com/slack',
      enabled: false,
    });
    await alertChannels.create({
      tenantId: 'tenant-2',
      type: 'webhook',
      name: 'other tenant',
      url: 'https://example.com/hook2',
      enabled: true,
    });

    const webhookAlerter = new RecordingAlerter('webhook');
    const slackAlerter = new RecordingAlerter('slack');
    const factory = new MapAlerterFactory(
      new Map<AlertChannelType, IAlerter>([
        ['webhook', webhookAlerter],
        ['slack', slackAlerter],
      ]),
    );
    const useCase = new DispatchStatusChangeAlertsUseCase(alertChannels, factory, { error: () => undefined });

    await useCase.execute(makeEvent('tenant-1'));

    expect(webhookAlerter.sent).toHaveLength(1);
    expect(slackAlerter.sent).toHaveLength(0); // disabled channel never dispatched
  });

  it('isolates a failing channel so it does not block the others', async () => {
    const alertChannels = new InMemoryAlertChannelRepository();
    await alertChannels.create({
      tenantId: 'tenant-1',
      type: 'webhook',
      name: 'working',
      url: 'https://example.com/hook',
      enabled: true,
    });
    await alertChannels.create({
      tenantId: 'tenant-1',
      type: 'slack',
      name: 'broken',
      url: 'https://example.com/slack',
      enabled: true,
    });

    const webhookAlerter = new RecordingAlerter('webhook');
    const brokenSlackAlerter = new RecordingAlerter('slack', true);
    const factory = new MapAlerterFactory(
      new Map<AlertChannelType, IAlerter>([
        ['webhook', webhookAlerter],
        ['slack', brokenSlackAlerter],
      ]),
    );
    const loggedErrors: unknown[] = [];
    const useCase = new DispatchStatusChangeAlertsUseCase(alertChannels, factory, {
      error: (context) => loggedErrors.push(context),
    });

    await expect(useCase.execute(makeEvent('tenant-1'))).resolves.toBeUndefined();

    expect(webhookAlerter.sent).toHaveLength(1);
    expect(loggedErrors).toHaveLength(1);
  });
});
