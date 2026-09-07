import { ConflictException } from '@nestjs/common';
import { EncounterStatus } from '@prisma/client';

import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { ClinicalAccessService } from './clinical-access.service';

const user = { id: 'user-1' } as AuthenticatedUser;

describe('ClinicalAccessService', () => {
  const prisma = {
    encounter: { findUnique: jest.fn() },
    patientChamber: { findMany: jest.fn() },
    chamberMembership: { findMany: jest.fn(), findFirst: jest.fn() },
  };
  const permissions = { requirePermissions: jest.fn() };
  const service = new ClinicalAccessService(prisma as never, permissions as never);

  beforeEach(() => jest.resetAllMocks());

  it('denies writing clinical records to a locked encounter', async () => {
    prisma.encounter.findUnique.mockResolvedValue({
      id: 'encounter-1',
      chamberId: 'chamber-1',
      status: EncounterStatus.LOCKED,
    });
    permissions.requirePermissions.mockResolvedValue(undefined);

    await expect(service.assertWrite(user, 'encounter-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('allows writing while the encounter is in progress', async () => {
    prisma.encounter.findUnique.mockResolvedValue({
      id: 'encounter-1',
      chamberId: 'chamber-1',
      status: EncounterStatus.IN_PROGRESS,
    });
    permissions.requirePermissions.mockResolvedValue(undefined);

    await expect(service.assertWrite(user, 'encounter-1')).resolves.toMatchObject({
      id: 'encounter-1',
    });
  });
});
