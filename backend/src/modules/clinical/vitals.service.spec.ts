import { BadRequestException } from '@nestjs/common';

import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { VitalsService } from './vitals.service';

const user = { id: 'user-1' } as AuthenticatedUser;

describe('VitalsService', () => {
  const prisma = {
    vital: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  };
  const access = {
    assertWrite: jest.fn(),
    assertRead: jest.fn(),
    assertPatientRead: jest.fn(),
    assertClinicalUser: jest.fn(),
  };
  const service = new VitalsService(prisma as never, access as never);

  beforeEach(() => jest.resetAllMocks());

  it('records vitals and computes BMI from weight and height', async () => {
    access.assertWrite.mockResolvedValue({ patientId: 'patient-1', encounterId: 'encounter-1' });
    prisma.vital.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve({ id: 'vital-1', ...data, recordedAt: new Date() }),
    );

    const result = await service.create(user, 'encounter-1', { weightKg: 72, heightCm: 170 });

    expect(prisma.vital.create).toHaveBeenCalledTimes(1);
    expect(result.bmi).toBeCloseTo(24.91, 2);
    expect(result.weightKg).toBe(72);
  });

  it('rejects an empty vital record', async () => {
    access.assertWrite.mockResolvedValue({ patientId: 'patient-1', encounterId: 'encounter-1' });

    await expect(service.create(user, 'encounter-1', {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
