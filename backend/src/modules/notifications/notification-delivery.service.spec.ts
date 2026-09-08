import { NotificationChannel, NotificationStatus } from '@prisma/client';

import { NotificationDeliveryService } from './notification-delivery.service';

describe('NotificationDeliveryService', () => {
  const prisma = { notification: { findUnique: jest.fn(), update: jest.fn() } };
  const service = new NotificationDeliveryService(prisma as never);

  beforeEach(() => jest.resetAllMocks());

  it('marks a notification sent after the channel adapter accepts it', async () => {
    prisma.notification.findUnique.mockResolvedValue({
      id: 'notification-1',
      type: 'PAYMENT_RECEIPT',
      channel: NotificationChannel.SMS,
      status: NotificationStatus.PENDING,
    });

    await service.deliver('notification-1');

    expect(prisma.notification.update).toHaveBeenCalledTimes(1);
  });

  it('does not redeliver a completed notification', async () => {
    prisma.notification.findUnique.mockResolvedValue({
      id: 'notification-1',
      status: NotificationStatus.SENT,
    });

    await service.deliver('notification-1');
    expect(prisma.notification.update).not.toHaveBeenCalled();
  });
});
