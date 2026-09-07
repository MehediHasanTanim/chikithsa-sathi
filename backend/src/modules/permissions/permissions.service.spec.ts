import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { PermissionsService } from './permissions.service';

describe('PermissionsService', () => {
  const prisma = {
    permission: { findMany: jest.fn() },
    role: { findUnique: jest.fn() },
  };
  const chamberAccess = { assertMember: jest.fn() };
  const service = new PermissionsService(prisma as never, chamberAccess as never);

  beforeEach(() => jest.resetAllMocks());

  it('grants the full permission set to DOCTOR without querying the database', async () => {
    const granted = await service.rolePermissions(UserRole.DOCTOR);
    expect(granted.has('prescriptions.finalize')).toBe(true);
    expect(granted.has('staff.manage')).toBe(true);
    expect(prisma.role.findUnique).not.toHaveBeenCalled();
  });

  it('resolves permissions from the seeded role', async () => {
    prisma.role.findUnique.mockResolvedValue({
      permissions: [
        { permission: { code: 'patients.read' } },
        { permission: { code: 'queue.manage' } },
      ],
    });

    const granted = await service.rolePermissions(UserRole.RECEPTIONIST);

    expect([...granted].sort()).toEqual(['patients.read', 'queue.manage']);
  });

  it('denies when a required permission is missing', async () => {
    chamberAccess.assertMember.mockResolvedValue({ role: UserRole.BILLING_STAFF });
    prisma.role.findUnique.mockResolvedValue({
      permissions: [{ permission: { code: 'payments.read' } }],
    });

    await expect(
      service.requirePermissions('user-1', 'chamber-1', ['staff.manage']),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
