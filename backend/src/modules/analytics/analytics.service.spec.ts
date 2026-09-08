import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { AnalyticsService } from './analytics.service';

const user = { id: 'user-1' } as AuthenticatedUser;

describe('AnalyticsService', () => {
  const prisma = {
    queueEntry: { findMany: jest.fn() },
    appointment: { count: jest.fn() },
    encounter: { count: jest.fn(), findMany: jest.fn() },
    payment: { aggregate: jest.fn(), count: jest.fn() },
    paymentRefund: { aggregate: jest.fn() },
    patientChamber: { count: jest.fn() },
  };
  const permissions = { requirePermissions: jest.fn() };
  const service = new AnalyticsService(prisma as never, permissions as never);

  beforeEach(() => jest.resetAllMocks());

  it('returns dashboard metrics with refunded revenue and average consultation time', async () => {
    permissions.requirePermissions.mockResolvedValue(undefined);
    prisma.queueEntry.findMany.mockResolvedValue([
      { patientId: 'patient-1' },
      { patientId: 'patient-2' },
    ]);
    prisma.appointment.count.mockResolvedValueOnce(8).mockResolvedValueOnce(1);
    prisma.encounter.count.mockResolvedValue(3);
    prisma.payment.aggregate.mockResolvedValue({ _sum: { amount: { toString: () => '1500.00' } } });
    prisma.paymentRefund.aggregate.mockResolvedValue({
      _sum: { amount: { toString: () => '200.00' } },
    });
    prisma.encounter.findMany.mockResolvedValue([
      {
        startedAt: new Date('2026-09-08T09:00:00Z'),
        completedAt: new Date('2026-09-08T09:20:00Z'),
      },
      {
        startedAt: new Date('2026-09-08T10:00:00Z'),
        completedAt: new Date('2026-09-08T10:40:00Z'),
      },
    ]);

    const result = await service.dashboard(user, { chamberId: 'chamber-1', date: '2026-09-08' });

    expect(permissions.requirePermissions).toHaveBeenCalledWith(user.id, 'chamber-1', [
      'staff.read',
    ]);
    expect(result).toMatchObject({
      todayPatients: 2,
      appointments: 8,
      completedConsultations: 3,
      noShows: 1,
      revenue: 1300,
      averageConsultationMinutes: 30,
    });
  });

  it('protects revenue analytics with payment-read permission', async () => {
    permissions.requirePermissions.mockRejectedValue(new Error('denied'));

    await expect(service.revenue(user, { chamberId: 'chamber-1' })).rejects.toThrow('denied');
    expect(prisma.payment.aggregate).not.toHaveBeenCalled();
  });
});
