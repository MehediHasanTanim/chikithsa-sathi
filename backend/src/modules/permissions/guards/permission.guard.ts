import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';

import { ErrorCode } from '@common/constants/error-codes';
import { PERMISSIONS_KEY } from '../decorators/require-permission.decorator';
import { PermissionsService } from '../permissions.service';

/**
 * Enforces `@RequirePermission(...)` metadata for chamber-scoped routes.
 * Reuses the membership resolved by `ChamberAccessGuard` when present, and
 * otherwise resolves it itself from the `:chamberId`/`:id` route parameter.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissions: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const user = request.user;
    const required =
      this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (!user || required.length === 0) return required.length === 0;

    const chamberId =
      request.chamberMembership?.chamberId ?? request.chamber?.id ?? this.chamberIdFrom(request);
    if (!chamberId) return false;

    const membership =
      request.chamberMembership ?? (await this.permissions.resolveMembership(user.id, chamberId));

    const granted = await this.permissions.rolePermissions(membership.role);
    const allowed = required.every((permission) => granted.has(permission));
    if (!allowed) {
      throw new ForbiddenException({
        code: ErrorCode.PermissionDenied,
        message: 'You do not have permission to perform this action',
        details: [],
      });
    }
    return true;
  }

  private chamberIdFrom(request: FastifyRequest): string | undefined {
    const params = request.params as Record<string, string | undefined> | undefined;
    return params?.chamberId ?? params?.id;
  }
}
