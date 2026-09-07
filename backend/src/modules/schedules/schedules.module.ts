import { Module } from '@nestjs/common';

import { AuthModule } from '@modules/auth/auth.module';
import { ChambersModule } from '@modules/chambers/chambers.module';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';

@Module({
  imports: [AuthModule, ChambersModule],
  controllers: [SchedulesController],
  providers: [SchedulesService],
})
export class SchedulesModule {}
