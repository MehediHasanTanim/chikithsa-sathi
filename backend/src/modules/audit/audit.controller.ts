import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, Max, Min, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { AuditAction } from '@prisma/client';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { AuditQueryService } from './audit.service';
import { AuditService } from '@modules/auth/services/audit.service';
class QueryDto { @IsUUID() chamberId!: string; @IsOptional() @IsEnum(AuditAction) action?: AuditAction; @IsOptional() @IsUUID() actorId?: string; @IsOptional() @IsString() entityType?: string; @IsOptional() @IsDateString() dateFrom?: string; @IsOptional() @IsDateString() dateTo?: string; @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number; @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number; }
@ApiTags('Audit logs') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller({ path: 'audit-logs', version: '1' })
export class AuditController {
  constructor(private readonly audit: AuditQueryService, private readonly recorder: AuditService) {}
  @Get() @ApiOperation({ summary: 'List immutable chamber-scoped audit events' }) list(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryDto) { return this.audit.list(user, query); }
  @Get('export') @ApiOperation({ summary: 'Export filtered chamber audit events' }) async export(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryDto) {
    const result = await this.audit.list(user, { ...query, page: 1, limit: 100 });
    await this.recorder.recordDomain(AuditAction.AUDIT_LOG_EXPORTED, user.id, 'AuditLog', query.chamberId, { filters: { action: query.action, actorId: query.actorId, entityType: query.entityType, dateFrom: query.dateFrom, dateTo: query.dateTo } }, query.chamberId);
    return result;
  }
}
