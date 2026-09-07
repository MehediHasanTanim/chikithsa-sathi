import { Module } from '@nestjs/common';

import { AuthModule } from '@modules/auth/auth.module';
import { ChambersModule } from '@modules/chambers/chambers.module';
import { PermissionsModule } from '@modules/permissions/permissions.module';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';

@Module({
  imports: [AuthModule, ChambersModule, PermissionsModule],
  controllers: [StaffController],
  providers: [StaffService],
})
export class StaffModule {}
