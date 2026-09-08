import { ArgumentsHost, Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { Prisma } from '@prisma/client';

import { ErrorCode } from '@common/constants/error-codes';
import { AppException } from '@common/exceptions/app.exception';

type ExceptionBody = {
  code?: string;
  message?: string | string[];
  details?: unknown[];
};

@Catch()
export class HttpExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  override catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<FastifyReply>();
    const request = context.getRequest<FastifyRequest>();
    const normalized = this.normalize(exception);

    if (normalized.status >= 500) {
      this.logger.error(
        JSON.stringify({
          event: 'http.request_failed',
          requestId: request.requestId,
          method: request.method,
          path: request.url?.split('?')[0] ?? '/',
          status: normalized.status,
          code: normalized.code,
        }),
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    void response.status(normalized.status).send({
      success: false,
      error: {
        code: normalized.code,
        message: normalized.message,
        details: normalized.details,
      },
      requestId: request.requestId,
    });
  }

  private normalize(exception: unknown): {
    status: number;
    code: string;
    message: string;
    details: unknown[];
  } {
    if (exception instanceof AppException) {
      return {
        status: exception.getStatus(),
        code: exception.code,
        message: exception.message,
        details: exception.details,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        return {
          status: HttpStatus.CONFLICT,
          code: ErrorCode.Conflict,
          message: 'A duplicate record exists',
          details: [],
        };
      }
      if (exception.code === 'P2025') {
        return {
          status: HttpStatus.NOT_FOUND,
          code: ErrorCode.NotFound,
          message: 'The requested record was not found',
          details: [],
        };
      }
    }

    if (exception instanceof HttpException) {
      const body = exception.getResponse() as string | ExceptionBody;
      const details = typeof body === 'object' && Array.isArray(body.message) ? body.message : [];
      const message =
        typeof body === 'string'
          ? body
          : Array.isArray(body.message)
            ? 'Validation failed'
            : (body.message ?? exception.message);
      const code =
        typeof body === 'object' && body.code
          ? body.code
          : this.codeForStatus(exception.getStatus(), Array.isArray(details));

      return { status: exception.getStatus(), code, message, details };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: ErrorCode.Internal,
      message: 'An unexpected error occurred',
      details: [],
    };
  }

  private codeForStatus(status: number, validationError: boolean): string {
    if (validationError) return ErrorCode.Validation;
    switch (status) {
      case 400:
        return ErrorCode.BadRequest;
      case 401:
        return ErrorCode.Unauthorized;
      case 403:
        return ErrorCode.Forbidden;
      case 404:
        return ErrorCode.NotFound;
      case 409:
        return ErrorCode.Conflict;
      case 503:
        return ErrorCode.ServiceUnavailable;
      default:
        return ErrorCode.Internal;
    }
  }
}
