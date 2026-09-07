import { ForbiddenException, Injectable } from '@nestjs/common';
import { Chamber, ChamberMembership, MembershipStatus, UserRole } from '@prisma/client';

import { ErrorCode } from '@common/constants/error-codes';
import { PrismaService } from '@database/prisma/prisma.service';

export type ChamberWithOwner = Chamber & {
  owner: { id: string; fullName: string };
};

export type ActiveMembership = ChamberMembership & { chamber: ChamberWithOwner };

@Injectable()
export class ChamberAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveMembership(userId: string, chamberId: string): Promise<ActiveMembership | null> {
    return this.prisma.chamberMembership.findUnique({
      where: { chamberId_userId: { chamberId, userId } },
      include: {
        chamber: { include: { owner: { select: { id: true, fullName: true } } } },
      },
    });
  }

  /** Resolve an active membership for the user, or fail closed. */
  async assertMember(
    userId: string,
    chamberId: string,
    roles?: UserRole[],
  ): Promise<ActiveMembership> {
    const membership = await this.getActiveMembership(userId, chamberId);
    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      throw this.forbidden(ErrorCode.ChamberForbidden, 'You do not have access to this chamber');
    }
    if (roles && roles.length > 0 && !roles.includes(membership.role)) {
      throw this.forbidden(ErrorCode.ChamberNotOwner, 'This action requires chamber owner access');
    }
    return membership;
  }

  /** Resolve a membership for a doctor who owns the chamber. */
  async assertOwner(userId: string, chamberId: string): Promise<ActiveMembership> {
    return this.assertMember(userId, chamberId, [UserRole.DOCTOR]);
  }

  private forbidden(code: string, message: string): ForbiddenException {
    return new ForbiddenException({ code, message, details: [] });
  }
}
