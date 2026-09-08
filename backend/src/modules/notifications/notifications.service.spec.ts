import { Prisma } from '@prisma/client';

import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  const prisma = {
    appointment: { findUnique: jest.fn() },
    queueEntry: { findUnique: jest.fn() },
    prescription: { findUnique: jest.fn() },
    payment: { findUnique: jest.fn() },
    chamberMembership: { findUnique: jest.fn() },
    notification: { create: jest.fn(), count: jest.fn() },
  };
  const queue = { enqueue: jest.fn() };
  const service = new NotificationsService(prisma as never, queue as never);

  beforeEach(() => jest.resetAllMocks());

  it('creates channel-specific, idempotent payment receipt notifications', async () => {
    prisma.payment.findUnique.mockResolvedValue({
      id: 'payment-1',
      chamberId: 'chamber-1',
      paymentNumber: 'PMT-1',
      amount: { toString: () => '500.00' },
      currency: 'BDT',
      patient: { phone: '+8801800000000', email: 'patient@example.test' },
    });
    prisma.notification.create
      .mockResolvedValueOnce({ id: 'notification-sms' })
      .mockResolvedValueOnce({ id: 'notification-email' });

    await service.paymentReceipt('payment-1');

    expect(prisma.notification.create).toHaveBeenCalledTimes(2);
    expect(queue.enqueue).toHaveBeenCalledTimes(2);
    expect(queue.enqueue).toHaveBeenCalledWith('notification-sms', expect.any(Date));
  });

  it('treats a duplicate delivery key as an already queued notification', async () => {
    prisma.payment.findUnique.mockResolvedValue({
      id: 'payment-1',
      chamberId: 'chamber-1',
      paymentNumber: 'PMT-1',
      amount: { toString: () => '500.00' },
      currency: 'BDT',
      patient: { phone: '+8801800000000', email: null },
    });
    prisma.notification.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Duplicate notification', {
        code: 'P2002',
        clientVersion: '6.19.3',
      }),
    );

    await expect(service.paymentReceipt('payment-1')).resolves.toBeUndefined();
    expect(queue.enqueue).not.toHaveBeenCalled();
  });
});
