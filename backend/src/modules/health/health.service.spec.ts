import { ServiceUnavailableException } from '@nestjs/common';

import { HealthService } from './health.service';

describe('HealthService', () => {
  const prisma = { ping: jest.fn() };
  const redis = { ping: jest.fn() };
  const service = new HealthService(prisma as never, redis as never);

  beforeEach(() => jest.resetAllMocks());

  it('reports liveness without checking infrastructure', () => {
    expect(service.live().status).toBe('ok');
    expect(prisma.ping).not.toHaveBeenCalled();
    expect(redis.ping).not.toHaveBeenCalled();
  });

  it('reports ready after PostgreSQL and Redis respond', async () => {
    prisma.ping.mockResolvedValue(undefined);
    redis.ping.mockResolvedValue(undefined);

    await expect(service.ready()).resolves.toMatchObject({ status: 'ok' });
  });

  it('does not disclose failed infrastructure in readiness responses', async () => {
    prisma.ping.mockRejectedValue(new Error('postgres host secret'));
    redis.ping.mockResolvedValue(undefined);

    await expect(service.ready()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
