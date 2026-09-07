import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChamberMembership, MembershipStatus, UserRole } from '@prisma/client';

import { ErrorCode } from '@common/constants/error-codes';
import { PrismaService } from '@database/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { PermissionsService } from '@modules/permissions/permissions.service';
import type { InviteStaffDto } from './dto/invite-staff.dto';
import type { UpdateStaffDto } from './dto/update-staff.dto';

type MembershipWithUser = ChamberMembership & {
  user: { id: string; fullName: string; phone: string; email: string | null };
};

export type PublicStaffMembership = {
  id: string;
  chamberId: string;
  role: UserRole;
  status: MembershipStatus;
  invitedAt: Date | null;
  joinedAt: Date | null;
  removedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: { id: string; fullName: string; phone: string; email: string | null };
};

const userSelect = { id: true, fullName: true, phone: true, email: true } as const;

@Injectable()
export class StaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsService,
  ) {}

  async list(chamberId: string): Promise<PublicStaffMembership[]> {
    const memberships = await this.prisma.chamberMembership.findMany({
      where: { chamberId, status: { not: MembershipStatus.REMOVED } },
      include: { user: { select: userSelect } },
      orderBy: { createdAt: 'asc' },
    });
    return memberships.map((membership) => this.toPublic(membership));
  }

  async invite(
    user: AuthenticatedUser,
    chamberId: string,
    dto: InviteStaffDto,
  ): Promise<PublicStaffMembership> {
    const target = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
      select: userSelect,
    });
    if (!target) throw this.notFound(ErrorCode.StaffUserNotFound, 'No user found with this phone');
    if (target.id === user.id) {
      throw new ConflictException({
        code: ErrorCode.StaffSelfAction,
        message: 'You are already the chamber owner',
        details: [],
      });
    }

    const existing = await this.prisma.chamberMembership.findUnique({
      where: { chamberId_userId: { chamberId, userId: target.id } },
    });
    if (
      existing &&
      (existing.status === MembershipStatus.ACTIVE ||
        existing.status === MembershipStatus.SUSPENDED)
    ) {
      throw new ConflictException({
        code: ErrorCode.Conflict,
        message: 'User is already a member of this chamber',
        details: [],
      });
    }

    const membership = await this.prisma.chamberMembership.upsert({
      where: { chamberId_userId: { chamberId, userId: target.id } },
      create: {
        chamberId,
        userId: target.id,
        role: dto.role,
        status: MembershipStatus.INVITED,
        invitedById: user.id,
        invitedAt: new Date(),
      },
      update: {
        role: dto.role,
        status: MembershipStatus.INVITED,
        invitedById: user.id,
        invitedAt: new Date(),
        joinedAt: null,
        removedAt: null,
      },
    });
    return this.toPublic({ ...membership, user: target });
  }

  async update(
    user: AuthenticatedUser,
    membershipId: string,
    dto: UpdateStaffDto,
  ): Promise<PublicStaffMembership> {
    const membership = await this.findMembership(membershipId);
    await this.permissions.requirePermissions(user.id, membership.chamberId, ['staff.manage']);
    this.assertNotSelf(membership, user.id);

    const updated = await this.prisma.chamberMembership.update({
      where: { id: membership.id },
      data: {
        ...(dto.role !== undefined ? { role: dto.role } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.status === MembershipStatus.ACTIVE && !membership.joinedAt
          ? { joinedAt: new Date() }
          : {}),
        ...(dto.status === MembershipStatus.REMOVED ? { removedAt: new Date() } : {}),
      },
      include: { user: { select: userSelect } },
    });
    return this.toPublic(updated);
  }

  async remove(user: AuthenticatedUser, membershipId: string): Promise<PublicStaffMembership> {
    const membership = await this.findMembership(membershipId);
    await this.permissions.requirePermissions(user.id, membership.chamberId, ['staff.manage']);
    this.assertNotSelf(membership, user.id);

    const updated = await this.prisma.chamberMembership.update({
      where: { id: membership.id },
      data: { status: MembershipStatus.REMOVED, removedAt: new Date() },
      include: { user: { select: userSelect } },
    });
    return this.toPublic(updated);
  }

  async resendInvitation(
    user: AuthenticatedUser,
    membershipId: string,
  ): Promise<{ message: string }> {
    const membership = await this.findMembership(membershipId);
    await this.permissions.requirePermissions(user.id, membership.chamberId, ['staff.invite']);
    if (membership.status !== MembershipStatus.INVITED) {
      throw new BadRequestException({
        code: ErrorCode.BadRequest,
        message: 'Invitation is no longer pending',
        details: [],
      });
    }
    await this.prisma.chamberMembership.update({
      where: { id: membership.id },
      data: { invitedAt: new Date() },
    });
    return { message: 'Invitation re-sent' };
  }

  private async findMembership(membershipId: string): Promise<ChamberMembership> {
    const membership = await this.prisma.chamberMembership.findUnique({
      where: { id: membershipId },
    });
    if (!membership) throw this.notFound(ErrorCode.StaffNotFound, 'Staff membership was not found');
    return membership;
  }

  private assertNotSelf(membership: ChamberMembership, userId: string): void {
    if (membership.userId === userId) {
      throw new BadRequestException({
        code: ErrorCode.StaffSelfAction,
        message: 'You cannot change your own membership',
        details: [],
      });
    }
  }

  private toPublic(membership: MembershipWithUser): PublicStaffMembership {
    return {
      id: membership.id,
      chamberId: membership.chamberId,
      role: membership.role,
      status: membership.status,
      invitedAt: membership.invitedAt,
      joinedAt: membership.joinedAt,
      removedAt: membership.removedAt,
      createdAt: membership.createdAt,
      updatedAt: membership.updatedAt,
      user: {
        id: membership.user.id,
        fullName: membership.user.fullName,
        phone: membership.user.phone,
        email: membership.user.email,
      },
    };
  }

  private notFound(code: string, message: string): NotFoundException {
    return new NotFoundException({ code, message, details: [] });
  }
}
