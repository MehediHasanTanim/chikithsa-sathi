import { Module } from '@nestjs/common';

import { AuthModule } from '@modules/auth/auth.module';
import { PermissionsModule } from '@modules/permissions/permissions.module';
import { ClinicalAccessService } from './clinical-access.service';
import { ClinicalNotesController } from './clinical-notes.controller';
import { ClinicalNotesService } from './clinical-notes.service';
import { DiagnosesController } from './diagnoses.controller';
import { DiagnosesService } from './diagnoses.service';
import { InvestigationsController } from './investigations.controller';
import { InvestigationsService } from './investigations.service';
import { VitalsController } from './vitals.controller';
import { VitalsService } from './vitals.service';

@Module({
  imports: [AuthModule, PermissionsModule],
  controllers: [
    VitalsController,
    ClinicalNotesController,
    DiagnosesController,
    InvestigationsController,
  ],
  providers: [
    ClinicalAccessService,
    VitalsService,
    ClinicalNotesService,
    DiagnosesService,
    InvestigationsService,
  ],
  exports: [ClinicalAccessService, VitalsService, ClinicalNotesService],
})
export class ClinicalModule {}
