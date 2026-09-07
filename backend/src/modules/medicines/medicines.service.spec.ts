import { ForbiddenException } from '@nestjs/common';

import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { MedicinesService } from './medicines.service';

const user = { id: 'user-1' } as AuthenticatedUser;

describe('MedicinesService', () => {
  const prisma = {
    medicine: { findMany: jest.fn(), findUnique: jest.fn() },
    doctorMedicineFavorite: { findMany: jest.fn(), upsert: jest.fn(), deleteMany: jest.fn() },
    chamberMembership: { findFirst: jest.fn() },
  };
  const doctors = { getOrCreateProfile: jest.fn() };
  const service = new MedicinesService(prisma as never, doctors as never);

  beforeEach(() => jest.resetAllMocks());

  it('searches medicines for a clinical user', async () => {
    prisma.chamberMembership.findFirst.mockResolvedValue({ id: 'membership-1' });
    prisma.medicine.findMany.mockResolvedValue([{ id: 'medicine-1', genericName: 'Paracetamol' }]);

    const result = await service.search(user, 'para');

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ genericName: 'Paracetamol' });
  });

  it('denies medicine search for a non-clinical user', async () => {
    prisma.chamberMembership.findFirst.mockResolvedValue(null);

    await expect(service.search(user, 'para')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('adds a medicine to the doctor favorites', async () => {
    prisma.chamberMembership.findFirst.mockResolvedValue({ id: 'membership-1' });
    doctors.getOrCreateProfile.mockResolvedValue({ id: 'doctor-1' });
    prisma.medicine.findUnique.mockResolvedValue({ id: 'medicine-1', genericName: 'Paracetamol' });
    prisma.doctorMedicineFavorite.upsert.mockResolvedValue({
      id: 'favorite-1',
      medicine: { id: 'medicine-1', genericName: 'Paracetamol' },
    });

    const result = await service.addFavorite(user, { medicineId: 'medicine-1' });

    expect(result.medicine.genericName).toBe('Paracetamol');
  });
});
