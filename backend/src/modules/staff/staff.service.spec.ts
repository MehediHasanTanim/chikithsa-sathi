import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { MembershipStatus, UserRole } from '@prisma/client';

import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { StaffService } from './staff.service';

const owner = { id: 'owner-1' } as AuthenticatedUser;

const membership = {
  id: 'membership-1',
  chamberId: 'chamber-1',
  userId: 'user-2',
  role: UserRole.RECEPTIONIST,
  status: MembershipStatus.INVITED,
  invitedById: 'owner-1',
  invitedAt: new Date(),
  joinedAt: null,
  removedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('StaffService', () => {
  const prisma = {
    user: { findUnique: jest.fn() },
    chamberMembership: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
  };
  const permissions = { requirePermissions: jest.fn(), rolePermissions: jest.fn() };
  const notifications = { staffInvitation: jest.fn() };
  const service = new StaffService(prisma as never, permissions as never, notifications as never);

  beforeEach(() => {
    jest.resetAllMocks();
    permissions.requirePermissions.mockResolvedValue({ role: UserRole.DOCTOR });
    permissions.rolePermissions.mockResolvedValue(new Set(['all-permissions']));
  });

  it('invites an existing user with INVITED status', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-2',
      fullName: 'Rahim Uddin',
      phone: '+8801812345678',
      email: null,
    });
    prisma.chamberMembership.findUnique.mockResolvedValue(null);
    prisma.chamberMembership.upsert.mockResolvedValue(membership);

    await expect(
      service.invite(owner, 'chamber-1', {
        phone: '+8801812345678',
        role: UserRole.RECEPTIONIST,
      }),
    ).resolves.toMatchObject({
      status: MembershipStatus.INVITED,
      user: { id: 'user-2', fullName: 'Rahim Uddin' },
    });

    const upsertArgs = (
      prisma.chamberMembership.upsert.mock.calls as Array<
        [{ create: { status: MembershipStatus; role: UserRole } }]
      >
    )[0]![0];
    expect(upsertArgs.create).toMatchObject({
      status: MembershipStatus.INVITED,
      role: UserRole.RECEPTIONIST,
    });
  });

  it('rejects inviting an unknown phone', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.invite(owner, 'chamber-1', {
        phone: '+8801812345678',
        role: UserRole.RECEPTIONIST,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects inviting yourself', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'owner-1',
      fullName: 'Dr. Owner',
      phone: '+8801812345678',
      email: null,
    });

    await expect(
      service.invite(owner, 'chamber-1', {
        phone: '+8801812345678',
        role: UserRole.RECEPTIONIST,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('removes a staff member by setting status REMOVED', async () => {
    prisma.chamberMembership.findUnique.mockResolvedValue({
      ...membership,
      status: MembershipStatus.ACTIVE,
    });
    permissions.requirePermissions.mockResolvedValue(undefined);
    prisma.chamberMembership.update.mockResolvedValue({
      ...membership,
      status: MembershipStatus.REMOVED,
      removedAt: new Date(),
      user: { id: 'user-2', fullName: 'Rahim Uddin', phone: '+8801812345678', email: null },
    });

    await expect(service.remove(owner, 'membership-1')).resolves.toMatchObject({
      status: MembershipStatus.REMOVED,
    });

    expect(permissions.requirePermissions).toHaveBeenCalledWith('owner-1', 'chamber-1', [
      'staff.manage',
    ]);
    const updateArgs = (
      prisma.chamberMembership.update.mock.calls as Array<[{ data: { status: MembershipStatus } }]>
    )[0]![0];
    expect(updateArgs.data).toMatchObject({ status: MembershipStatus.REMOVED });
  });

  it('prevents removing yourself', async () => {
    prisma.chamberMembership.findUnique.mockResolvedValue({
      ...membership,
      userId: 'owner-1',
      role: UserRole.DOCTOR,
    });
    permissions.requirePermissions.mockResolvedValue(undefined);

    await expect(service.remove(owner, 'membership-1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('prevents assigning a role with permissions the actor does not hold', async () => {
    prisma.chamberMembership.findUnique.mockResolvedValue({
      ...membership,
      status: MembershipStatus.ACTIVE,
    });
    permissions.requirePermissions.mockResolvedValue({ role: UserRole.CHAMBER_MANAGER });
    permissions.rolePermissions
      .mockResolvedValueOnce(new Set(['staff.manage']))
      .mockResolvedValueOnce(new Set(['staff.manage', 'encounters.update']));

    await expect(
      service.update(owner, 'membership-1', { role: UserRole.ASSISTANT_DOCTOR }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.chamberMembership.update).not.toHaveBeenCalled();
  });

  it('allows assigning a role with an equal permission set', async () => {
    prisma.chamberMembership.findUnique.mockResolvedValue({
      ...membership,
      status: MembershipStatus.ACTIVE,
    });
    permissions.requirePermissions.mockResolvedValue({ role: UserRole.CHAMBER_MANAGER });
    permissions.rolePermissions.mockResolvedValue(new Set(['staff.manage']));
    prisma.chamberMembership.update.mockResolvedValue({
      ...membership,
      role: UserRole.CHAMBER_MANAGER,
      user: { id: 'user-2', fullName: 'Rahim Uddin', phone: '+8801812345678', email: null },
    });

    await expect(
      service.update(owner, 'membership-1', { role: UserRole.CHAMBER_MANAGER }),
    ).resolves.toMatchObject({ role: UserRole.CHAMBER_MANAGER });
  });

  it('prevents a manager from activating a more privileged pending invitation', async () => {
    prisma.chamberMembership.findUnique.mockResolvedValue({
      ...membership,
      role: UserRole.ASSISTANT_DOCTOR,
      status: MembershipStatus.INVITED,
    });
    permissions.requirePermissions.mockResolvedValue({ role: UserRole.CHAMBER_MANAGER });
    permissions.rolePermissions
      .mockResolvedValueOnce(new Set(['staff.manage']))
      .mockResolvedValueOnce(new Set(['staff.manage', 'encounters.update']));

    await expect(
      service.update(owner, 'membership-1', { status: MembershipStatus.ACTIVE }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.chamberMembership.update).not.toHaveBeenCalled();
  });

  it('prevents a manager from inviting a more privileged role', async () => {
    permissions.requirePermissions.mockResolvedValue({ role: UserRole.CHAMBER_MANAGER });
    permissions.rolePermissions
      .mockResolvedValueOnce(new Set(['staff.invite']))
      .mockResolvedValueOnce(new Set(['staff.invite', 'encounters.update']));

    await expect(
      service.invite(owner, 'chamber-1', {
        phone: '+8801812345678',
        role: UserRole.ASSISTANT_DOCTOR,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it.each([UserRole.DOCTOR, UserRole.PLATFORM_ADMIN])(
    'never assigns privileged %s roles through staff updates',
    async (role) => {
      prisma.chamberMembership.findUnique.mockResolvedValue({
        ...membership,
        status: MembershipStatus.ACTIVE,
      });
      permissions.requirePermissions.mockResolvedValue({ role: UserRole.DOCTOR });

      await expect(service.update(owner, 'membership-1', { role })).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(prisma.chamberMembership.update).not.toHaveBeenCalled();
    },
  );

  it('does not allow the owner membership to be managed as staff', async () => {
    prisma.chamberMembership.findUnique.mockResolvedValue({
      ...membership,
      userId: 'another-owner',
      role: UserRole.DOCTOR,
      status: MembershipStatus.ACTIVE,
    });
    permissions.requirePermissions.mockResolvedValue({ role: UserRole.DOCTOR });

    await expect(
      service.update(owner, 'membership-1', { status: MembershipStatus.SUSPENDED }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.chamberMembership.update).not.toHaveBeenCalled();
  });
});
