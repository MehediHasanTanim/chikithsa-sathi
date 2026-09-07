import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@prisma/client';
import type { FastifyRequest } from 'fastify';

import { CHAMBER_ROLES_KEY } from '../decorators/require-chamber-role.decorator';
import { ChamberAccessService } from '../services/chamber-access.service';

/**
 * Verifies the authenticated user is an active member of the chamber addressed
 * by `:chamberId` (or `:id`) in the route, and optionally enforces chamber roles
 * declared with `@RequireChamberRole`. The resolved membership and chamber are
 * attached to the request for downstream handlers.
 */
@Injectable()
export class ChamberAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly chamberAccess: ChamberAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const user = request.user;
    const chamberId = this.chamberIdFrom(request);
    if (!user || !chamberId) return false;

    const roles = this.reflector.getAllAndOverride<UserRole[]>(CHAMBER_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const membership = await this.chamberAccess.assertMember(user.id, chamberId, roles ?? []);
    request.chamberMembership = membership;
    request.chamber = membership.chamber;
    return true;
  }

  private chamberIdFrom(request: FastifyRequest): string | undefined {
    const params = request.params as Record<string, string | undefined> | undefined;
    return params?.chamberId ?? params?.id;
  }
}
