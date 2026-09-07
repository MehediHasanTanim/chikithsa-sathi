import { BadRequestException } from '@nestjs/common';
import { EncounterStatus, PrescriptionStatus } from '@prisma/client';

import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { PrescriptionsService } from './prescriptions.service';

const user = { id: 'user-1' } as AuthenticatedUser;

const prescriptionRecord = {
  id: 'prescription-1',
  prescriptionNumber: 'PR-ABC23456',
  chamberId: 'chamber-1',
  patientId: 'patient-1',
  doctorId: 'doctor-1',
  encounterId: 'encounter-1',
  status: PrescriptionStatus.DRAFT,
  language: 'bn',
  clinicalSummary: null,
  advice: null,
  followUpDate: null,
  aiGenerated: false,
  version: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  items: [],
};

describe('PrescriptionsService', () => {
  const prisma = {
    encounter: { findUnique: jest.fn() },
    prescription: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  };
  const permissions = { requirePermissions: jest.fn() };
  const service = new PrescriptionsService(prisma as never, permissions as never);

  beforeEach(() => jest.resetAllMocks());

  it('creates a draft prescription with items for an encounter', async () => {
    prisma.encounter.findUnique.mockResolvedValue({
      id: 'encounter-1',
      patientId: 'patient-1',
      chamberId: 'chamber-1',
      status: EncounterStatus.IN_PROGRESS,
      chamber: { ownerDoctorId: 'doctor-1' },
    });
    permissions.requirePermissions.mockResolvedValue(undefined);
    prisma.prescription.create.mockResolvedValue(prescriptionRecord);

    const result = await service.create(user, 'encounter-1', {
      items: [{ medicineId: 'medicine-1', dosage: '1+0+1' }],
    });

    expect(prisma.prescription.create).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ id: 'prescription-1', status: PrescriptionStatus.DRAFT });
  });

  it('rejects editing a finalized prescription', async () => {
    prisma.prescription.findUnique.mockResolvedValue({
      ...prescriptionRecord,
      status: PrescriptionStatus.FINALIZED,
    });
    permissions.requirePermissions.mockResolvedValue(undefined);

    await expect(service.update(user, 'prescription-1', { advice: 'Rest' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
