import { NotFoundException } from '@nestjs/common';
import { DiagnosisType } from '@prisma/client';

import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { DiagnosesService } from './diagnoses.service';

const user = { id: 'user-1' } as AuthenticatedUser;

describe('DiagnosesService', () => {
  const prisma = {
    diagnosis: { findUnique: jest.fn(), findMany: jest.fn() },
    encounterDiagnosis: { create: jest.fn(), findMany: jest.fn(), deleteMany: jest.fn() },
  };
  const access = {
    assertWrite: jest.fn(),
    assertRead: jest.fn(),
    assertClinicalUser: jest.fn(),
  };
  const service = new DiagnosesService(prisma as never, access as never);

  beforeEach(() => jest.resetAllMocks());

  it('assigns a diagnosis from the catalog to an encounter', async () => {
    access.assertWrite.mockResolvedValue({});
    prisma.diagnosis.findUnique.mockResolvedValue({ id: 'diagnosis-1', name: 'Hypertension' });
    prisma.encounterDiagnosis.create.mockResolvedValue({
      id: 'encounter-diagnosis-1',
      diagnosis: { id: 'diagnosis-1', name: 'Hypertension' },
    });

    const result = await service.assign(user, 'encounter-1', {
      diagnosisId: 'diagnosis-1',
      type: DiagnosisType.PRIMARY,
    });

    expect(prisma.encounterDiagnosis.create).toHaveBeenCalledTimes(1);
    expect(result.diagnosis.name).toBe('Hypertension');
  });

  it('rejects assigning an unknown diagnosis', async () => {
    access.assertWrite.mockResolvedValue({});
    prisma.diagnosis.findUnique.mockResolvedValue(null);

    await expect(
      service.assign(user, 'encounter-1', { diagnosisId: 'missing' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
