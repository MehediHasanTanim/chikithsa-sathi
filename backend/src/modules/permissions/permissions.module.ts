import { Module } from '@nestjs/common';

import { AuthModule } from '@modules/auth/auth.module';
import { ChambersModule } from '@modules/chambers/chambers.module';
import { PermissionGuard } from './guards/permission.guard';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';

@Module({
  imports: [AuthModule, ChambersModule],
  controllers: [PermissionsController],
  providers: [PermissionsService, PermissionGuard],
  exports: [PermissionsService, PermissionGuard],
})
export class PermissionsModule {}
