import { ForbiddenException } from '@nestjs/common';
import { MembershipStatus, UserRole } from '@prisma/client';

import { ChamberAccessService } from './chamber-access.service';

describe('ChamberAccessService', () => {
  const prisma = { chamberMembership: { findUnique: jest.fn() } };
  const service = new ChamberAccessService(prisma as never);

  beforeEach(() => jest.resetAllMocks());

  const activeMembership = {
    id: 'membership-1',
    chamberId: 'chamber-1',
    userId: 'user-1',
    role: UserRole.DOCTOR,
    status: MembershipStatus.ACTIVE,
    chamber: { id: 'chamber-1', owner: { id: 'doctor-1', fullName: 'Dr. Rahman' } },
  };

  it('resolves an active membership', async () => {
    prisma.chamberMembership.findUnique.mockResolvedValue(activeMembership);
    await expect(service.assertMember('user-1', 'chamber-1')).resolves.toEqual(activeMembership);
  });

  it('denies access when there is no membership', async () => {
    prisma.chamberMembership.findUnique.mockResolvedValue(null);
    await expect(service.assertMember('user-1', 'chamber-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('denies access for a non-active membership', async () => {
    prisma.chamberMembership.findUnique.mockResolvedValue({
      ...activeMembership,
      status: MembershipStatus.SUSPENDED,
    });
    await expect(service.assertMember('user-1', 'chamber-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('denies owner access for a non-doctor role', async () => {
    prisma.chamberMembership.findUnique.mockResolvedValue({
      ...activeMembership,
      role: UserRole.RECEPTIONIST,
    });
    await expect(service.assertOwner('user-1', 'chamber-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
