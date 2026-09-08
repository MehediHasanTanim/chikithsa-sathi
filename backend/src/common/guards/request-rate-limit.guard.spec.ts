import { HttpException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { ExecutionContext } from '@nestjs/common';

import { ErrorCode } from '@common/constants/error-codes';
import type { RedisService } from '@infrastructure/cache/redis.service';
import { RequestRateLimitGuard } from './request-rate-limit.guard';

describe('RequestRateLimitGuard', () => {
  const redisMock = { consumeRateLimit: jest.fn() };
  const redis = redisMock as unknown as RedisService;
  const config = {
    getOrThrow: jest.fn((key: string) => (key === 'app.apiRateLimitMax' ? 2 : 30)),
  } as unknown as ConfigService;
  const reply = { header: jest.fn() };

  beforeEach(() => jest.clearAllMocks());

  it('does not rate limit liveness and readiness probes', async () => {
    const guard = new RequestRateLimitGuard(redis, config);
    await expect(guard.canActivate(context('/health/live'))).resolves.toBe(true);
    expect(redisMock.consumeRateLimit).not.toHaveBeenCalled();
  });

  it('limits by client IP and returns a retry hint', async () => {
    const guard = new RequestRateLimitGuard(redis, config);
    redisMock.consumeRateLimit.mockResolvedValue(3);

    await expect(guard.canActivate(context('/v1/patients?search=private'))).rejects.toMatchObject({
      status: 429,
    });
    expect(redisMock.consumeRateLimit).toHaveBeenCalledWith('api', '203.0.113.7', 30);
    expect(reply.header).toHaveBeenCalledWith('retry-after', '30');

    try {
      await guard.canActivate(context('/v1/patients'));
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getResponse()).toMatchObject({ code: ErrorCode.RateLimited });
    }
  });

  it('fails closed with a controlled response when Redis is unavailable', async () => {
    const guard = new RequestRateLimitGuard(redis, config);
    redisMock.consumeRateLimit.mockRejectedValue(new Error('connection refused'));

    await expect(guard.canActivate(context('/v1/patients'))).rejects.toMatchObject({
      status: 503,
    });
  });

  function context(url: string): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ url, ip: '203.0.113.7' }),
        getResponse: () => reply,
      }),
    } as unknown as ExecutionContext;
  }
});
