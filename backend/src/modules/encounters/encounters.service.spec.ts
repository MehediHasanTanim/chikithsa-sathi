import { BadRequestException, ConflictException } from '@nestjs/common';
import { EncounterStatus } from '@prisma/client';

import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { EncountersService } from './encounters.service';

const user = { id: 'user-1' } as AuthenticatedUser;

const encounterRecord = {
  id: 'encounter-1',
  chamberId: 'chamber-1',
  patientId: 'patient-1',
  doctorId: 'doctor-1',
  appointmentId: null,
  queueEntryId: null,
  encounterDate: new Date('2026-09-07T00:00:00Z'),
  status: EncounterStatus.DRAFT,
  chiefComplaint: null,
  startedAt: null,
  completedAt: null,
  lockedAt: null,
  version: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('EncountersService', () => {
  const prisma = {
    chamber: { findUnique: jest.fn() },
    patientChamber: { findUnique: jest.fn() },
    appointment: { findUnique: jest.fn() },
    queueEntry: { findUnique: jest.fn() },
    encounter: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  };
  const permissions = { requirePermissions: jest.fn() };
  const events = {
    created: jest.fn(),
    started: jest.fn(),
    completed: jest.fn(),
    locked: jest.fn(),
  };
  const service = new EncountersService(prisma as never, permissions as never, events as never);

  beforeEach(() => jest.resetAllMocks());

  const stubCreate = () => {
    permissions.requirePermissions.mockResolvedValue(undefined);
    prisma.chamber.findUnique.mockResolvedValue({
      id: 'chamber-1',
      ownerDoctorId: 'doctor-1',
      timezone: 'Asia/Dhaka',
    });
    prisma.patientChamber.findUnique.mockResolvedValue({ id: 'link-1' });
  };

  it('creates a draft encounter', async () => {
    stubCreate();
    prisma.encounter.create.mockResolvedValue(encounterRecord);

    const result = await service.create(user, { chamberId: 'chamber-1', patientId: 'patient-1' });

    expect(prisma.encounter.create).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ id: 'encounter-1', status: EncounterStatus.DRAFT });
  });

  it('rejects creating an encounter for an unlinked patient', async () => {
    stubCreate();
    prisma.patientChamber.findUnique.mockResolvedValue(null);

    await expect(
      service.create(user, { chamberId: 'chamber-1', patientId: 'patient-1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('starts a draft encounter', async () => {
    permissions.requirePermissions.mockResolvedValue(undefined);
    prisma.encounter.findUnique.mockResolvedValue(encounterRecord);
    prisma.encounter.update.mockResolvedValue({
      ...encounterRecord,
      status: EncounterStatus.IN_PROGRESS,
      startedAt: new Date(),
    });

    const result = await service.start(user, 'encounter-1');

    expect(result.status).toBe(EncounterStatus.IN_PROGRESS);
  });

  it('rejects completing an encounter that is not ready for review', async () => {
    permissions.requirePermissions.mockResolvedValue(undefined);
    prisma.encounter.findUnique.mockResolvedValue(encounterRecord); // DRAFT

    await expect(service.complete(user, 'encounter-1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects editing a locked encounter', async () => {
    permissions.requirePermissions.mockResolvedValue(undefined);
    prisma.encounter.findUnique.mockResolvedValue({
      ...encounterRecord,
      status: EncounterStatus.LOCKED,
    });

    await expect(
      service.update(user, 'encounter-1', { chiefComplaint: 'Fever' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
