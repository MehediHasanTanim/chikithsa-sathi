import { ConflictException } from '@nestjs/common';
import { Prisma, QueueStatus } from '@prisma/client';

import { ErrorCode } from '@common/constants/error-codes';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { QueueService } from './queue.service';

const user = { id: 'user-1' } as AuthenticatedUser;

const entryRecord = {
  id: 'queue-1',
  chamberId: 'chamber-1',
  patientId: 'patient-1',
  appointmentId: 'appointment-1',
  doctorId: 'doctor-1',
  queueDate: new Date('2026-09-07T00:00:00Z'),
  queueNumber: 1,
  status: QueueStatus.WAITING,
  priority: 0,
  checkedInAt: new Date(),
  calledAt: null,
  consultationStartedAt: null,
  completedAt: null,
  skipReason: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('QueueService', () => {
  const prisma = {
    chamber: { findUnique: jest.fn() },
    patientChamber: { findUnique: jest.fn() },
    appointment: { findUnique: jest.fn(), update: jest.fn() },
    queueEntry: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };
  const permissions = { requirePermissions: jest.fn() };
  const events = {
    checkedIn: jest.fn(),
    called: jest.fn(),
    consultationStarted: jest.fn(),
    completed: jest.fn(),
  };
  const service = new QueueService(prisma as never, permissions as never, events as never);

  beforeEach(() => jest.resetAllMocks());

  const stubCheckIn = () => {
    permissions.requirePermissions.mockResolvedValue(undefined);
    prisma.chamber.findUnique.mockResolvedValue({
      id: 'chamber-1',
      ownerDoctorId: 'doctor-1',
      timezone: 'Asia/Dhaka',
    });
    prisma.patientChamber.findUnique.mockResolvedValue({ id: 'link-1' });
    prisma.queueEntry.findFirst.mockResolvedValue(null);
    prisma.$queryRaw.mockResolvedValue([{ lastNumber: 1 }]);
    prisma.queueEntry.create.mockResolvedValue(entryRecord);
  };

  it('checks in a patient and marks the appointment as checked in', async () => {
    stubCheckIn();
    prisma.appointment.findUnique.mockResolvedValue({
      id: 'appointment-1',
      chamberId: 'chamber-1',
      patientId: 'patient-1',
      status: 'BOOKED',
    });

    const result = await service.checkIn(user, {
      chamberId: 'chamber-1',
      patientId: 'patient-1',
      appointmentId: 'appointment-1',
    });

    expect(result).toMatchObject({ queueEntryId: 'queue-1', queueNumber: 1, status: 'WAITING' });
    const updateArgs = (
      prisma.appointment.update.mock.calls as Array<
        [{ where: { id: string }; data: { status: string; checkedInAt: Date } }]
      >
    )[0]![0];
    expect(updateArgs.where).toEqual({ id: 'appointment-1' });
    expect(updateArgs.data.status).toBe('CHECKED_IN');
    expect(updateArgs.data.checkedInAt).toBeInstanceOf(Date);
  });

  it('rejects a duplicate check-in for the same patient on the same day', async () => {
    stubCheckIn();
    prisma.queueEntry.findFirst.mockResolvedValue({ id: 'existing-1' });

    await expect(
      service.checkIn(user, { chamberId: 'chamber-1', patientId: 'patient-1' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('transitions a waiting entry to called', async () => {
    permissions.requirePermissions.mockResolvedValue(undefined);
    prisma.queueEntry.findUnique.mockResolvedValueOnce(entryRecord).mockResolvedValueOnce({
      ...entryRecord,
      status: QueueStatus.CALLED,
      calledAt: new Date(),
    });
    prisma.queueEntry.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.call(user, 'queue-1');

    expect(result.status).toBe(QueueStatus.CALLED);
    const updateArgs = (
      prisma.queueEntry.updateMany.mock.calls as Array<
        [
          {
            where: { id: string; status: { in: QueueStatus[] } };
            data: { status: QueueStatus; calledAt?: Date };
          },
        ]
      >
    )[0]![0];
    expect(updateArgs.where).toEqual({
      id: 'queue-1',
      status: { in: [QueueStatus.WAITING] },
    });
    expect(updateArgs.data.status).toBe(QueueStatus.CALLED);
    expect(updateArgs.data.calledAt).toBeInstanceOf(Date);
  });

  it('rejects a stale state transition without overwriting the queue entry', async () => {
    permissions.requirePermissions.mockResolvedValue(undefined);
    prisma.queueEntry.findUnique.mockResolvedValue(entryRecord);
    prisma.queueEntry.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.call(user, 'queue-1')).rejects.toBeInstanceOf(ConflictException);

    expect(events.called).not.toHaveBeenCalled();
  });

  it('rejects recalling an entry when it would duplicate an active patient queue entry', async () => {
    permissions.requirePermissions.mockResolvedValue(undefined);
    prisma.queueEntry.findUnique.mockResolvedValue({ ...entryRecord, status: QueueStatus.SKIPPED });
    prisma.queueEntry.updateMany.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Duplicate active queue entry', {
        code: 'P2002',
        clientVersion: '6.19.3',
        meta: { target: 'QueueEntry_activePatientPerDay_key' },
      }),
    );

    try {
      await service.recall(user, 'queue-1');
      fail('Expected a duplicate check-in error');
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).getResponse()).toMatchObject({
        code: ErrorCode.QueueDuplicateCheckIn,
      });
    }
  });

  it('maps a concurrent active-queue unique-index conflict to QueueDuplicateCheckIn', async () => {
    stubCheckIn();
    prisma.queueEntry.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Duplicate active queue entry', {
        code: 'P2002',
        clientVersion: '6.19.3',
        meta: { target: 'QueueEntry_activePatientPerDay_key' },
      }),
    );

    try {
      await service.checkIn(user, { chamberId: 'chamber-1', patientId: 'patient-1' });
      fail('Expected a duplicate check-in error');
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).getResponse()).toMatchObject({
        code: ErrorCode.QueueDuplicateCheckIn,
      });
    }
  });

  it('rejects completing an entry that is not in consultation', async () => {
    permissions.requirePermissions.mockResolvedValue(undefined);
    prisma.queueEntry.findUnique.mockResolvedValue(entryRecord); // WAITING

    await expect(service.complete(user, 'queue-1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('allocates the next queue number from the daily counter', async () => {
    stubCheckIn();
    prisma.$queryRaw.mockResolvedValue([{ lastNumber: 12 }]);
    prisma.queueEntry.create.mockResolvedValue({ ...entryRecord, queueNumber: 12 });

    const result = await service.checkIn(user, { chamberId: 'chamber-1', patientId: 'patient-1' });

    expect(result.queueNumber).toBe(12);
  });
});
