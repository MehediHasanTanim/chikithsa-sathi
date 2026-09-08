import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(config: ConfigService) {
    this.client = new Redis(config.getOrThrow<string>('redis.url'), {
      keyPrefix: config.getOrThrow<string>('redis.keyPrefix'),
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      retryStrategy: (attempt) => Math.min(2_000, Math.max(100, attempt * 100)),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.client.connect();
    this.logger.log('Redis connection established');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.status !== 'end') await this.client.quit();
  }

  async ping(): Promise<void> {
    const response = await this.client.ping();
    if (response !== 'PONG') throw new Error('Redis did not respond to ping');
  }

  /** Atomically consume one request from a fixed-window rate limit. */
  async consumeRateLimit(
    domain: string,
    identifier: string,
    windowSeconds: number,
  ): Promise<number> {
    const key = this.key(`rate-limit:${domain}`, identifier);
    const count = await this.client.incr(key);
    if (count === 1) await this.client.expire(key, windowSeconds);
    return count;
  }

  key(domain: string, key: string): string {
    return `${domain}:${key}`;
  }
}
