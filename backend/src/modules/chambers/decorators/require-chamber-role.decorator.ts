import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@prisma/client';

export const CHAMBER_ROLES_KEY = 'chamberRoles';

/**
 * Restricts a chamber-scoped route to members holding one of the given roles.
 * Requires `ChamberAccessGuard` to be applied to the route.
 */
export const RequireChamberRole = (...roles: UserRole[]) => SetMetadata(CHAMBER_ROLES_KEY, roles);
