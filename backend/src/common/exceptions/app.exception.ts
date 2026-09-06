import { HttpException, HttpStatus } from '@nestjs/common';

import type { ErrorCode } from '@common/constants/error-codes';

export class AppException extends HttpException {
  constructor(
    public readonly code: ErrorCode | string,
    message: string,
    status: HttpStatus,
    public readonly details: unknown[] = [],
  ) {
    super({ code, message, details }, status);
  }
}
