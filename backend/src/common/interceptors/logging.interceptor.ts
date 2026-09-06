import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const startedAt = performance.now();

    return next.handle().pipe(
      tap({
        next: () => this.log(request, context, startedAt),
        error: () => this.log(request, context, startedAt),
      }),
    );
  }

  private log(request: FastifyRequest, context: ExecutionContext, startedAt: number): void {
    const response = context.switchToHttp().getResponse<{ statusCode: number }>();
    this.logger.log({
      requestId: request.requestId,
      method: request.method,
      path: request.url,
      status: response.statusCode,
      durationMs: Math.round(performance.now() - startedAt),
    });
  }
}
