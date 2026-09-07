import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { ChamberWithOwner } from '../services/chamber-access.service';

/**
 * Injects the chamber loaded by `ChamberAccessGuard` into a handler argument.
 */
export const CurrentChamber = createParamDecorator(
  (_data: unknown, context: ExecutionContext): ChamberWithOwner =>
    context.switchToHttp().getRequest<{ chamber: ChamberWithOwner }>().chamber,
);
