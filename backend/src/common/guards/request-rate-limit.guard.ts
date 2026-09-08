import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { ErrorCode } from '@common/constants/error-codes';
import { RedisService } from '@infrastructure/cache/redis.service';

const UNLIMITED_PATHS = new Set(['/health', '/health/live', '/health/ready']);

/** A coarse API-wide limit that complements stricter authentication limits. */
@Injectable()
export class RequestRateLimitGuard implements CanActivate {
  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const path = request.url?.split('?')[0] ?? '/';
    if (UNLIMITED_PATHS.has(path) || path.endsWith('/metrics')) return true;

    const limit = this.config.getOrThrow<number>('app.apiRateLimitMax');
    const windowSeconds = this.config.getOrThrow<number>('app.apiRateLimitWindowSeconds');
    let count: number;
    try {
      count = await this.redis.consumeRateLimit('api', request.ip, windowSeconds);
    } catch {
      throw new ServiceUnavailableException({
        code: ErrorCode.CacheUnavailable,
        message: 'Request protection is temporarily unavailable.',
        details: [],
      });
    }
    if (count <= limit) return true;

    const reply = context.switchToHttp().getResponse<FastifyReply>();
    reply.header('retry-after', String(windowSeconds));
    throw new HttpException(
      {
        code: ErrorCode.RateLimited,
        message: 'Too many requests. Please try again later.',
        details: [],
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
