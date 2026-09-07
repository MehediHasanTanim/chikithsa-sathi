import { Module } from '@nestjs/common';

import { AuthModule } from '@modules/auth/auth.module';
import { DoctorsModule } from '@modules/doctors/doctors.module';
import { ChamberAccessService } from './services/chamber-access.service';
import { ChamberAccessGuard } from './guards/chamber-access.guard';
import { ChambersController } from './chambers.controller';
import { ChambersService } from './chambers.service';

@Module({
  imports: [AuthModule, DoctorsModule],
  controllers: [ChambersController],
  providers: [ChambersService, ChamberAccessService, ChamberAccessGuard],
  exports: [ChambersService, ChamberAccessService, ChamberAccessGuard],
})
export class ChambersModule {}
