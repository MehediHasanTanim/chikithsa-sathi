import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { ErrorCode } from '@common/constants/error-codes';
import { PrismaService } from '@database/prisma/prisma.service';
import {
  ChamberAccessService,
  type ActiveMembership,
} from '@modules/chambers/services/chamber-access.service';
import { PERMISSION_CODES } from './permissions.constants';

@Injectable()
export class PermissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chamberAccess: ChamberAccessService,
  ) {}

  async listPermissions(): Promise<{ code: string; description: string | null }[]> {
    const permissions = await this.prisma.permission.findMany({ orderBy: { code: 'asc' } });
    return permissions.map((permission) => ({
      code: permission.code,
      description: permission.description,
    }));
  }

  /** Resolve the effective permission set for a chamber role. */
  async rolePermissions(role: UserRole): Promise<Set<string>> {
    // Practice owner and platform admin hold the full permission catalogue.
    if (role === UserRole.DOCTOR || role === UserRole.PLATFORM_ADMIN) {
      return new Set(PERMISSION_CODES);
    }
    const roleRecord = await this.prisma.role.findUnique({
      where: { name: role },
      include: { permissions: { include: { permission: true } } },
    });
    const codes =
      roleRecord?.permissions.map((rolePermission) => rolePermission.permission.code) ?? [];
    return new Set(codes);
  }

  async resolveMembership(userId: string, chamberId: string): Promise<ActiveMembership> {
    return this.chamberAccess.assertMember(userId, chamberId);
  }

  async myPermissions(
    userId: string,
    chamberId: string,
  ): Promise<{ role: UserRole; permissions: string[] }> {
    const membership = await this.chamberAccess.assertMember(userId, chamberId);
    const permissions = await this.rolePermissions(membership.role);
    return { role: membership.role, permissions: [...permissions].sort() };
  }

  /** Assert the user holds every required permission within the chamber. */
  async requirePermissions(
    userId: string,
    chamberId: string,
    required: string[],
  ): Promise<ActiveMembership> {
    const membership = await this.chamberAccess.assertMember(userId, chamberId);
    const granted = await this.rolePermissions(membership.role);
    const missing = required.filter((permission) => !granted.has(permission));
    if (missing.length > 0) throw this.denied();
    return membership;
  }

  private denied(): ForbiddenException {
    return new ForbiddenException({
      code: ErrorCode.PermissionDenied,
      message: 'You do not have permission to perform this action',
      details: [],
    });
  }
}
