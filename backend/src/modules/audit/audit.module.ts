import { Module } from '@nestjs/common';
import { AuthModule } from '@modules/auth/auth.module';
import { PermissionsModule } from '@modules/permissions/permissions.module';
import { AuditController } from './audit.controller';
import { AuditQueryService } from './audit.service';
@Module({ imports: [AuthModule, PermissionsModule], controllers: [AuditController], providers: [AuditQueryService] }) export class AuditModule {}
