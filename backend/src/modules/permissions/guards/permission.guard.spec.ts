import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { PermissionGuard } from './permission.guard';

describe('PermissionGuard', () => {
  const permissions = {
    resolveMembership: jest.fn(),
    rolePermissions: jest.fn(),
  };
  const reflector = { getAllAndOverride: jest.fn() };
  const guard = new PermissionGuard(reflector as never, permissions as never);

  const executionContext = (request: Record<string, unknown>) =>
    ({
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => () => undefined,
      getClass: () => class {},
    }) as never;

  beforeEach(() => jest.resetAllMocks());

  it('allows when the membership role holds the permission', async () => {
    reflector.getAllAndOverride.mockReturnValue(['staff.read']);
    permissions.rolePermissions.mockResolvedValue(new Set(['staff.read', 'staff.invite']));
    const request = {
      user: { id: 'user-1' },
      chamberMembership: { chamberId: 'chamber-1', role: UserRole.RECEPTIONIST },
    };

    await expect(guard.canActivate(executionContext(request))).resolves.toBe(true);
  });

  it('throws when the membership role lacks the permission', async () => {
    reflector.getAllAndOverride.mockReturnValue(['staff.manage']);
    permissions.rolePermissions.mockResolvedValue(new Set(['staff.read']));
    const request = {
      user: { id: 'user-1' },
      chamberMembership: { chamberId: 'chamber-1', role: UserRole.RECEPTIONIST },
    };

    await expect(guard.canActivate(executionContext(request))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('resolves membership when it is not attached to the request', async () => {
    reflector.getAllAndOverride.mockReturnValue(['staff.read']);
    permissions.resolveMembership.mockResolvedValue({ role: UserRole.CHAMBER_MANAGER });
    permissions.rolePermissions.mockResolvedValue(new Set(['staff.read']));
    const request = { user: { id: 'user-1' }, params: { chamberId: 'chamber-1' } };

    await expect(guard.canActivate(executionContext(request))).resolves.toBe(true);
    expect(permissions.resolveMembership).toHaveBeenCalledWith('user-1', 'chamber-1');
  });
});
