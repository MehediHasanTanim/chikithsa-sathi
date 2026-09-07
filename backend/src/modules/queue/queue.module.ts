import { Module } from '@nestjs/common';

import { AuthModule } from '@modules/auth/auth.module';
import { PermissionsModule } from '@modules/permissions/permissions.module';
import { QueueEventsService } from './queue-events.service';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';

@Module({
  imports: [AuthModule, PermissionsModule],
  controllers: [QueueController],
  providers: [QueueService, QueueEventsService],
  exports: [QueueService],
})
export class QueueModule {}
