import { Injectable, ServiceUnavailableException } from '@nestjs/common';

import { DatabaseRepository, Repository } from '@database/database.repository';
import { RedisService } from '@infrastructure/cache/redis.service';

@Injectable()
export class HealthService {
  constructor(
    @Repository() private readonly repository: DatabaseRepository,
    private readonly redis: RedisService,
  ) {}

  live() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  async ready() {
    try {
      await Promise.all([this.repository.ping(), this.redis.ping()]);
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
