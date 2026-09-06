export const ErrorCode = {
  BadRequest: 'BAD_REQUEST',
  Validation: 'VALIDATION_ERROR',
  Unauthorized: 'UNAUTHORIZED',
  Forbidden: 'FORBIDDEN',
  NotFound: 'NOT_FOUND',
  Conflict: 'CONFLICT',
  Internal: 'INTERNAL_SERVER_ERROR',
  ServiceUnavailable: 'SERVICE_UNAVAILABLE',
  DatabaseUnavailable: 'DATABASE_UNAVAILABLE',
  CacheUnavailable: 'CACHE_UNAVAILABLE',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
