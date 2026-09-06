import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { ErrorCode } from '@common/constants/error-codes';
import { RedisService } from '@infrastructure/cache/redis.service';

@Injectable()
export class AuthRateLimitService {
  constructor(private readonly redis: RedisService) {}

  async enforce(domain: 'login' | 'otp', identifier: string): Promise<void> {
    const policy =
      domain === 'login' ? { limit: 5, windowSeconds: 60 } : { limit: 5, windowSeconds: 600 };
    const count = await this.redis.consumeRateLimit(domain, identifier, policy.windowSeconds);
    if (count > policy.limit) {
      throw new HttpException(
        {
          code: ErrorCode.AuthRateLimited,
          message: 'Too many requests. Please try again later.',
          details: [],
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
