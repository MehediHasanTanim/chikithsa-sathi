import { Injectable } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { DatabaseRepository, Repository } from '@database/database.repository';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { PermissionsService } from '@modules/permissions/permissions.service';

@Injectable()
export class AuditQueryService {
  constructor(@Repository() private readonly repository: DatabaseRepository, private readonly permissions: PermissionsService) {}
  async list(user: AuthenticatedUser, query: { chamberId: string; action?: AuditAction; actorId?: string; entityType?: string; dateFrom?: string; dateTo?: string; page?: number; limit?: number }) {
    await this.permissions.requirePermissions(user.id, query.chamberId, ['staff.read']);
    const page = query.page ?? 1, limit = Math.min(query.limit ?? 50, 100), where: Prisma.AuditLogWhereInput = { chamberId: query.chamberId, ...(query.action ? { action: query.action } : {}), ...(query.actorId ? { userId: query.actorId } : {}), ...(query.entityType ? { entityType: query.entityType } : {}), ...(query.dateFrom || query.dateTo ? { createdAt: { ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}), ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}) } } : {}) };
    const [items, total] = await Promise.all([this.repository.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }), this.repository.auditLog.count({ where })]);
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
