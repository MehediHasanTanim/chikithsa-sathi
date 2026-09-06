import { Injectable, ServiceUnavailableException } from '@nestjs/common';

import { PrismaService } from '@database/prisma/prisma.service';
import { RedisService } from '@infrastructure/cache/redis.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  live() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  async ready() {
    try {
      await Promise.all([this.prisma.ping(), this.redis.ping()]);
      return { status: 'ok', timestamp: new Date().toISOString() };
    } catch {
      // Do not reveal dependency names, hostnames, or connection details to clients.
      throw new ServiceUnavailableException('Required infrastructure is unavailable');
    }
  }

  async health() {
    return this.ready();
  }
}
