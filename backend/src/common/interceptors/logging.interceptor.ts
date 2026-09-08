import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const startedAt = performance.now();

    return next.handle().pipe(
      tap({
        next: () => this.log(request, context, startedAt),
        error: (error: unknown) =>
          this.log(
            request,
            context,
            startedAt,
            error instanceof HttpException ? error.getStatus() : 500,
          ),
      }),
    );
  }

  private log(
    request: FastifyRequest,
    context: ExecutionContext,
    startedAt: number,
    status?: number,
  ): void {
    const response = context.switchToHttp().getResponse<{ statusCode: number }>();
    const durationMs = Math.round(performance.now() - startedAt);
    const path = request.routeOptions.url ?? request.url?.split('?')[0] ?? '/';
    const responseStatus = status ?? response.statusCode;
    this.metrics.recordHttp(request.method, path, responseStatus, durationMs);
    this.logger.log(
      JSON.stringify({
        requestId: request.requestId,
        method: request.method,
        path,
        status: responseStatus,
        durationMs,
      }),
    );
  }
}
