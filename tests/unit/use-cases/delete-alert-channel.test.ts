import { describe, expect, it } from 'vitest';

import { DeleteAlertChannelUseCase } from '../../../src/application/use-cases/alerts/delete-alert-channel.use-case.js';
import { NotFoundError } from '../../../src/domain/errors/domain-error.js';
import { InMemoryAlertChannelRepository } from '../../fakes/in-memory-alert-channel.repository.js';

describe('DeleteAlertChannelUseCase', () => {
  it('deletes an existing channel', async () => {
    const alertChannels = new InMemoryAlertChannelRepository();
    const channel = await alertChannels.create({
      tenantId: 'tenant-1',
      type: 'slack',
      name: '#alerts',
      url: 'https://hooks.slack.test/x',
      enabled: true,
    });
    const useCase = new DeleteAlertChannelUseCase(alertChannels);

    await useCase.execute('tenant-1', channel.id);
    expect(alertChannels.channels).toHaveLength(0);
  });

  it('throws NotFoundError for a channel owned by a different tenant', async () => {
    const alertChannels = new InMemoryAlertChannelRepository();
    const channel = await alertChannels.create({
      tenantId: 'tenant-1',
      type: 'slack',
      name: '#alerts',
      url: 'https://hooks.slack.test/x',
      enabled: true,
    });
    const useCase = new DeleteAlertChannelUseCase(alertChannels);

    await expect(useCase.execute('tenant-2', channel.id)).rejects.toBeInstanceOf(NotFoundError);
  });
});
