import { BadRequestException, ConflictException } from '@nestjs/common';
import { AppointmentStatus, Prisma } from '@prisma/client';

import { ErrorCode } from '@common/constants/error-codes';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { AppointmentsService } from './appointments.service';

const user = { id: 'user-1' } as AuthenticatedUser;

const scheduledAt = new Date('2026-09-11T11:00:00Z'); // 17:00 Asia/Dhaka
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dayOfWeek = weekdays.indexOf(
  new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Dhaka', weekday: 'short' }).format(
    scheduledAt,
  ),
);

const chamber = { id: 'chamber-1', ownerDoctorId: 'doctor-1', timezone: 'Asia/Dhaka' };
const schedule = {
  id: 'schedule-1',
  chamberId: 'chamber-1',
  doctorId: 'doctor-1',
  dayOfWeek,
  startTime: '17:00',
  endTime: '21:00',
  slotDurationMinutes: 15,
  maxPatients: 20,
  breaks: [],
};

const appointmentRecord = {
  id: 'appointment-1',
  appointmentCode: 'A-ABC23456',
  chamberId: 'chamber-1',
  patientId: 'patient-1',
  doctorId: 'doctor-1',
  scheduledAt,
  scheduledDate: new Date('2026-09-11T00:00:00Z'),
  type: 'NEW_PATIENT',
  status: 'BOOKED',
  tokenNumber: null,
  reason: null,
  notes: null,
  bookedByUserId: 'user-1',
  checkedInAt: null,
  completedAt: null,
  cancelledAt: null,
  cancellationReason: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AppointmentsService', () => {
  const tx = {
    schedule: { findFirst: jest.fn() },
    appointment: {
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };
  const prisma = {
    chamber: { findUnique: jest.fn() },
    patientChamber: { findUnique: jest.fn() },
    schedule: { findFirst: jest.fn() },
    appointment: {
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    transaction: jest.fn(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
  };
  const permissions = { requirePermissions: jest.fn() };
  const events = { confirmed: jest.fn() };
  const service = new AppointmentsService(prisma as never, permissions as never, events as never);

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.transaction.mockImplementation(
      async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx),
    );
    tx.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
  });

  const stubValidSlot = () => {
    prisma.chamber.findUnique.mockResolvedValue(chamber);
    prisma.patientChamber.findUnique.mockResolvedValue({ id: 'link-1' });
    tx.schedule.findFirst.mockResolvedValue(schedule);
    tx.appointment.count.mockResolvedValue(0);
    tx.appointment.findFirst.mockResolvedValue(null);
  };

  it('books a valid appointment', async () => {
    permissions.requirePermissions.mockResolvedValue(undefined);
    stubValidSlot();
    tx.appointment.create.mockResolvedValue(appointmentRecord);

    const result = await service.create(user, {
      chamberId: 'chamber-1',
      patientId: 'patient-1',
      scheduledAt: scheduledAt.toISOString(),
    });

    expect(tx.appointment.create).toHaveBeenCalledTimes(1);
    expect(prisma.transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    expect(result).toMatchObject({ id: 'appointment-1', status: 'BOOKED' });
  });

  it('rejects an appointment outside the schedule window', async () => {
    permissions.requirePermissions.mockResolvedValue(undefined);
    prisma.chamber.findUnique.mockResolvedValue(chamber);
    prisma.patientChamber.findUnique.mockResolvedValue({ id: 'link-1' });
    tx.schedule.findFirst.mockResolvedValue(schedule);

    await expect(
      service.create(user, {
        chamberId: 'chamber-1',
        patientId: 'patient-1',
        scheduledAt: '2026-09-11T16:00:00Z', // 22:00 local
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when no active schedule exists', async () => {
    permissions.requirePermissions.mockResolvedValue(undefined);
    prisma.chamber.findUnique.mockResolvedValue(chamber);
    prisma.patientChamber.findUnique.mockResolvedValue({ id: 'link-1' });
    tx.schedule.findFirst.mockResolvedValue(null);

    await expect(
      service.create(user, {
        chamberId: 'chamber-1',
        patientId: 'patient-1',
        scheduledAt: scheduledAt.toISOString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a duplicate slot booking', async () => {
    permissions.requirePermissions.mockResolvedValue(undefined);
    stubValidSlot();
    tx.appointment.findFirst.mockResolvedValue({ id: 'existing-1' });

    await expect(
      service.create(user, {
        chamberId: 'chamber-1',
        patientId: 'patient-1',
        scheduledAt: scheduledAt.toISOString(),
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('maps a concurrent doctor/time unique-index conflict to AppointmentConflict', async () => {
    permissions.requirePermissions.mockResolvedValue(undefined);
    stubValidSlot();
    tx.appointment.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Duplicate appointment slot', {
        code: 'P2002',
        clientVersion: '6.19.3',
        meta: { target: ['doctorId', 'scheduledAt'] },
      }),
    );

    try {
      await service.create(user, {
        chamberId: 'chamber-1',
        patientId: 'patient-1',
        scheduledAt: scheduledAt.toISOString(),
      });
      fail('Expected an appointment-slot conflict');
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).getResponse()).toMatchObject({
        code: ErrorCode.AppointmentConflict,
      });
    }
  });

  it('cancels a booked appointment', async () => {
    permissions.requirePermissions.mockResolvedValue(undefined);
    prisma.appointment.findUnique.mockResolvedValue(appointmentRecord);
    prisma.appointment.update.mockResolvedValue({
      ...appointmentRecord,
      status: AppointmentStatus.CANCELLED,
      cancelledAt: new Date(),
    });

    const result = await service.cancel(user, 'appointment-1', { reason: 'Patient requested' });

    expect(result.status).toBe(AppointmentStatus.CANCELLED);
  });
});
