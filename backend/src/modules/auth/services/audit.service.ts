import { Injectable } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';

import { PrismaService } from '@database/prisma/prisma.service';
import type { RequestContext } from '../auth.types';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(
    action: AuditAction,
    userId: string,
    context: RequestContext,
    entityId = userId,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        action,
        userId,
        entityType: 'User',
        entityId,
        requestId: context.requestId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
    });
  }

  async recordDomain(
    action: AuditAction,
    userId: string | undefined,
    entityType: string,
    entityId: string,
    metadata?: Prisma.InputJsonValue,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        action,
        ...(userId ? { userId } : {}),
        entityType,
        entityId,
        ...(metadata !== undefined ? { metadata } : {}),
      },
    });
  }
}
