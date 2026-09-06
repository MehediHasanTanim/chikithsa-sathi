import { randomUUID } from 'node:crypto';
import type { FastifyRequest } from 'fastify';

export const REQUEST_ID_HEADER = 'x-request-id';

export function getOrCreateRequestId(request: FastifyRequest): string {
  const supplied = request.headers[REQUEST_ID_HEADER];
  const value = Array.isArray(supplied) ? supplied[0] : supplied;
  return value?.trim() || randomUUID();
}
