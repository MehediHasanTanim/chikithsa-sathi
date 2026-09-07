import { ConflictException, ForbiddenException } from '@nestjs/common';

import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { PatientsService } from './patients.service';

const user = { id: 'user-1' } as AuthenticatedUser;

const patientRecord = {
  id: 'patient-1',
  patientCode: 'P-ABC23456',
  firstName: 'Abdul',
  lastName: 'Karim',
  fullName: 'Abdul Karim',
  nameBangla: null,
  phone: '+8801712345678',
  alternatePhone: null,
  email: null,
  dateOfBirth: new Date('1980-05-12T00:00:00.000Z'),
  gender: null,
  bloodGroup: null,
  nationalId: null,
  addressLine1: null,
  addressLine2: null,
  area: null,
  city: null,
  district: null,
  division: null,
  postalCode: null,
  emergencyName: null,
  emergencyPhone: null,
  emergencyRelation: null,
  profileImageFileId: null,
  createdById: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('PatientsService', () => {
  const tx = {
    patient: { create: jest.fn() },
    patientChamber: { create: jest.fn() },
  };
  const prisma = {
    patient: { findFirst: jest.fn(), findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn() },
    patientChamber: { findMany: jest.fn() },
    chamberMembership: { findMany: jest.fn() },
    transaction: jest.fn(),
  };
  const permissions = { requirePermissions: jest.fn() };
  const service = new PatientsService(prisma as never, permissions as never);

  beforeEach(() => jest.resetAllMocks());

  it('registers a patient and links it to the chamber', async () => {
    permissions.requirePermissions.mockResolvedValue(undefined);
    prisma.patient.findFirst.mockResolvedValue(null);
    prisma.transaction.mockImplementation((callback: (client: typeof tx) => unknown) =>
      Promise.resolve(callback(tx)),
    );
    tx.patient.create.mockResolvedValue(patientRecord);
    tx.patientChamber.create.mockResolvedValue({ id: 'link-1' });

    const result = await service.create(user, {
      chamberId: 'chamber-1',
      fullName: 'Abdul Karim',
      phone: '+8801712345678',
      dateOfBirth: '1980-05-12',
    });

    expect(tx.patient.create).toHaveBeenCalledTimes(1);
    expect(tx.patientChamber.create).toHaveBeenCalledWith({
      data: { patientId: 'patient-1', chamberId: 'chamber-1' },
    });
    expect(result).toMatchObject({
      id: 'patient-1',
      fullName: 'Abdul Karim',
      dateOfBirth: '1980-05-12',
    });
  });

  it('rejects a duplicate patient on phone + name + date of birth', async () => {
    permissions.requirePermissions.mockResolvedValue(undefined);
    prisma.patient.findFirst.mockResolvedValue({ id: 'existing-1' });

    await expect(
      service.create(user, {
        chamberId: 'chamber-1',
        fullName: 'Abdul Karim',
        phone: '+8801712345678',
        dateOfBirth: '1980-05-12',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('lists patients for a chamber with pagination', async () => {
    permissions.requirePermissions.mockResolvedValue(undefined);
    prisma.patient.findMany.mockResolvedValue([patientRecord]);
    prisma.patient.count.mockResolvedValue(1);

    const result = await service.list(user, { chamberId: 'chamber-1' });

    expect(result.items).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
    expect(result.items[0]).toMatchObject({ id: 'patient-1' });
  });

  it('denies access when the patient is not linked to an accessible chamber', async () => {
    prisma.patient.findUnique.mockResolvedValue(patientRecord);
    prisma.patientChamber.findMany.mockResolvedValue([{ chamberId: 'other-chamber' }]);
    prisma.chamberMembership.findMany.mockResolvedValue([{ chamberId: 'chamber-1' }]);

    await expect(service.getById(user, 'patient-1')).rejects.toBeInstanceOf(ForbiddenException);
  });
});
