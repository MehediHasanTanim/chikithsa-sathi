import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { ClinicalHistoryService } from './clinical-history.service';
@ApiTags('Clinical history') @ApiBearerAuth() @UseGuards(JwtAuthGuard)
@Controller({ path: 'patients/:patientId', version: '1' })
export class ClinicalHistoryController {
  constructor(private readonly history: ClinicalHistoryService) {}
  @Get('medication-history') @ApiOperation({ summary: 'Get chamber-scoped medication history' }) medication(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string, @Query('chamberId') chamberId: string) { return this.history.medicationHistory(user, patientId, chamberId); }
  @Get('clinical-timeline') @ApiOperation({ summary: 'Get chamber-scoped clinical timeline' }) timeline(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string, @Query('chamberId') chamberId: string) { return this.history.timeline(user, patientId, chamberId); }
}
