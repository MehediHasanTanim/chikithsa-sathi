import 'fastify';
import type { Chamber, ChamberMembership } from '@prisma/client';

import type { AuthenticatedUser } from '@modules/auth/auth.types';

declare module 'fastify' {
  interface FastifyRequest {
    requestId: string;
    user?: AuthenticatedUser;
    chamberMembership?: ChamberMembership;
    chamber?: Chamber;
  }
}
