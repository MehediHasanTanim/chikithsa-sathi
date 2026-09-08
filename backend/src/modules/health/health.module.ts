import { CommonModule } from '@common/common.module';
import { ApplicationConfigModule } from '@config/config.module';
import { Module } from '@nestjs/common';

import { DatabaseModule } from '@database/database.module';
import { InfrastructureModule } from '@infrastructure/infrastructure.module';

import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { MetricsController } from './metrics.controller';

@Module({
  imports: [ApplicationConfigModule, CommonModule, DatabaseModule, InfrastructureModule],
  controllers: [HealthController, MetricsController],
  providers: [HealthService],
})
export class HealthModule {}
