import { Module } from '@nestjs/common';

import { AuthModule } from '@modules/auth/auth.module';
import { DoctorsModule } from '@modules/doctors/doctors.module';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';

@Module({
  imports: [AuthModule, DoctorsModule],
  controllers: [VerificationController],
  providers: [VerificationService],
})
export class VerificationModule {}
