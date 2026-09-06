import { Module } from '@nestjs/common';

import { CommonModule } from '@common/common.module';
import { ApplicationConfigModule } from '@config/config.module';
import { DatabaseModule } from '@database/database.module';
import { InfrastructureModule } from '@infrastructure/infrastructure.module';
import { HealthModule } from '@modules/health/health.module';
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';

@Module({
  imports: [
    ApplicationConfigModule,
    CommonModule,
    DatabaseModule,
    InfrastructureModule,
    HealthModule,
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
