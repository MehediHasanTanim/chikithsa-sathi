import { Module } from '@nestjs/common';

import { AuthModule } from '@modules/auth/auth.module';
import { DoctorsModule } from '@modules/doctors/doctors.module';
import { MedicinesController } from './medicines.controller';
import { MedicinesService } from './medicines.service';

@Module({
  imports: [AuthModule, DoctorsModule],
  controllers: [MedicinesController],
  providers: [MedicinesService],
  exports: [MedicinesService],
})
export class MedicinesModule {}
