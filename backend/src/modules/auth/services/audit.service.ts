import { Injectable } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';

import { DatabaseRepository, Repository } from '@database/database.repository';
import type { RequestContext } from '../auth.types';

@Injectable()
export class AuditService {
  constructor(@Repository() private readonly repository: DatabaseRepository) {}

  async record(
    action: AuditAction,
    userId: string,
    context: RequestContext,
    entityId = userId,
  ): Promise<void> {
    await this.repository.auditLog.create({
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
    chamberId?: string,
  ): Promise<void> {
    await this.repository.auditLog.create({
      data: {
        action,
        ...(userId ? { userId } : {}),
        entityType,
        entityId,
        ...(metadata !== undefined ? { metadata } : {}),
        ...(chamberId ? { chamberId } : {}),
      },
    });
  }
}
