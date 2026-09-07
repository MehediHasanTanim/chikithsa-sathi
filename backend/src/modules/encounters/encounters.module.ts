import { Module } from '@nestjs/common';

import { AuthModule } from '@modules/auth/auth.module';
import { PermissionsModule } from '@modules/permissions/permissions.module';
import { EncounterEventsService } from './encounter-events.service';
import { EncountersController } from './encounters.controller';
import { EncountersService } from './encounters.service';

@Module({
  imports: [AuthModule, PermissionsModule],
  controllers: [EncountersController],
  providers: [EncountersService, EncounterEventsService],
  exports: [EncountersService],
})
export class EncountersModule {}
