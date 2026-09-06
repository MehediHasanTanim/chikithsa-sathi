import { Module } from '@nestjs/common';

import { DatabaseModule } from '@database/database.module';
import { InfrastructureModule } from '@infrastructure/infrastructure.module';

import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [DatabaseModule, InfrastructureModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
