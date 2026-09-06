import { Module } from '@nestjs/common';

import { RedisModule } from './cache/redis.module';

@Module({ imports: [RedisModule] })
export class InfrastructureModule {}
