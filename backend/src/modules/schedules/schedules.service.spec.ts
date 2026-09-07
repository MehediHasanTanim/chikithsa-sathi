import { BadRequestException, ConflictException } from '@nestjs/common';

import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { SchedulesService } from './schedules.service';

const user = { id: 'user-1' } as AuthenticatedUser;

const scheduleRecord = {
  id: 'schedule-1',
  chamberId: 'chamber-1',
  doctorId: 'doctor-1',
  dayOfWeek: 1,
  startTime: '17:00',
  endTime: '21:00',
  slotDurationMinutes: 15,
  maxPatients: 20,
  isActive: true,
  breaks: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('SchedulesService', () => {
  const prisma = {
    schedule: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    scheduleBreak: { deleteMany: jest.fn() },
    transaction: jest.fn(),
  };
  const chamberAccess = { assertMember: jest.fn(), assertOwner: jest.fn() };
  const service = new SchedulesService(prisma as never, chamberAccess as never);

  beforeEach(() => jest.resetAllMocks());

  describe('create', () => {
    it('creates a schedule for the chamber owner doctor', async () => {
      chamberAccess.assertOwner.mockResolvedValue({ chamber: { ownerDoctorId: 'doctor-1' } });
      prisma.schedule.findFirst.mockResolvedValue(null);
      prisma.schedule.create.mockResolvedValue(scheduleRecord);

      const result = await service.create(user, 'chamber-1', {
        dayOfWeek: 1,
        startTime: '17:00',
        endTime: '21:00',
      });

      const createArgs = (
        prisma.schedule.create.mock.calls as Array<
          [{ data: { chamberId: string; doctorId: string } }]
        >
      )[0]![0];
      expect(createArgs.data).toMatchObject({ chamberId: 'chamber-1', doctorId: 'doctor-1' });
      expect(result).toMatchObject({ id: 'schedule-1', startTime: '17:00' });
    });

    it('rejects a window where start is not before end', async () => {
      chamberAccess.assertOwner.mockResolvedValue({ chamber: { ownerDoctorId: 'doctor-1' } });

      await expect(
        service.create(user, 'chamber-1', { dayOfWeek: 1, startTime: '21:00', endTime: '17:00' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.schedule.create).not.toHaveBeenCalled();
    });

    it('rejects an overlapping schedule', async () => {
      chamberAccess.assertOwner.mockResolvedValue({ chamber: { ownerDoctorId: 'doctor-1' } });
      prisma.schedule.findFirst.mockResolvedValue({ id: 'schedule-existing' });

      await expect(
        service.create(user, 'chamber-1', {
          dayOfWeek: 1,
          startTime: '18:00',
          endTime: '20:00',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.schedule.create).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes a schedule after owner access is verified', async () => {
      prisma.schedule.findUnique.mockResolvedValue(scheduleRecord);
      chamberAccess.assertOwner.mockResolvedValue({});
      prisma.schedule.delete.mockResolvedValue(scheduleRecord);

      await expect(service.remove(user, 'schedule-1')).resolves.toEqual({
        message: 'Schedule deleted',
      });
      expect(prisma.schedule.delete).toHaveBeenCalledWith({ where: { id: 'schedule-1' } });
    });
  });
});
