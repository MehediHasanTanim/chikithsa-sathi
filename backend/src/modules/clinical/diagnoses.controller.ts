import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { DiagnosesService } from './diagnoses.service';
import { AssignDiagnosisDto } from './dto/assign-diagnosis.dto';

@ApiTags('Diagnoses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class DiagnosesController {
  constructor(private readonly diagnoses: DiagnosesService) {}

  @Get('diagnoses/search')
  @ApiOperation({ summary: 'Search the diagnosis catalog' })
  search(@CurrentUser() user: AuthenticatedUser, @Query('q') q?: string) {
    return this.diagnoses.search(user, q);
  }

  @Get('encounters/:encounterId/diagnoses')
  @ApiOperation({ summary: 'List diagnoses assigned to an encounter' })
  list(@CurrentUser() user: AuthenticatedUser, @Param('encounterId') encounterId: string) {
    return this.diagnoses.list(user, encounterId);
  }

  @Post('encounters/:encounterId/diagnoses')
  @ApiOperation({ summary: 'Assign a diagnosis to an encounter' })
  assign(
    @CurrentUser() user: AuthenticatedUser,
    @Param('encounterId') encounterId: string,
    @Body() dto: AssignDiagnosisDto,
  ) {
    return this.diagnoses.assign(user, encounterId, dto);
  }

  @Delete('encounters/:encounterId/diagnoses/:encounterDiagnosisId')
  @ApiOperation({ summary: 'Remove a diagnosis from an encounter' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('encounterId') encounterId: string,
    @Param('encounterDiagnosisId') encounterDiagnosisId: string,
  ) {
    return this.diagnoses.remove(user, encounterId, encounterDiagnosisId);
  }
}
