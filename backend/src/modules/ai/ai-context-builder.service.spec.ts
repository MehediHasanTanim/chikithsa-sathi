import { NotFoundException } from '@nestjs/common';

import { AIContextBuilderService } from './ai-context-builder.service';

describe('AIContextBuilderService', () => {
  const prisma = {
    patientChamber: { findUnique: jest.fn() },
    patient: { findUnique: jest.fn() },
    encounter: { findUnique: jest.fn() },
  };
  const service = new AIContextBuilderService(prisma as never);

  beforeEach(() => jest.resetAllMocks());

  it('builds minimized patient context without direct identifiers', async () => {
    prisma.patientChamber.findUnique.mockResolvedValue({ patientId: 'patient-1' });
    prisma.patient.findUnique.mockResolvedValue({
      dateOfBirth: new Date('1990-01-01T00:00:00Z'),
      gender: 'FEMALE',
      bloodGroup: 'O_POSITIVE',
      allergies: [{ allergen: 'Penicillin', reaction: 'Rash', severity: 'MODERATE' }],
      conditions: [{ condition: 'Asthma', status: 'ACTIVE' }],
    });

    const result = await service.build({ chamberId: 'chamber-1', patientId: 'patient-1' });

    const calls: unknown = prisma.patient.findUnique.mock.calls;
    const firstCall = (calls as unknown[][])[0];
    const firstArgument = firstCall?.[0] as { select: Record<string, unknown> } | undefined;
    const selection = firstArgument?.select;
    expect(selection).toEqual({
      dateOfBirth: true,
      gender: true,
      bloodGroup: true,
      allergies: true,
      conditions: true,
    });
    expect(selection).not.toHaveProperty('fullName');
    expect(selection).not.toHaveProperty('phone');
    expect(result.text).not.toContain('patient-1');
    expect(result.metadata).toMatchObject({ patientIncluded: true, encounterIncluded: false });
  });

  it('does not expose an encounter outside the requested chamber', async () => {
    prisma.encounter.findUnique.mockResolvedValue({
      id: 'encounter-1',
      chamberId: 'other-chamber',
      patientId: 'patient-1',
    });

    await expect(
      service.build({ chamberId: 'chamber-1', encounterId: 'encounter-1' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
