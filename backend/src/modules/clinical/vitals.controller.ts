import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { VitalsService } from './vitals.service';
import { CreateVitalDto } from './dto/create-vital.dto';
import { UpdateVitalDto } from './dto/update-vital.dto';

@ApiTags('Vitals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class VitalsController {
  constructor(private readonly vitals: VitalsService) {}

  @Post('encounters/:encounterId/vitals')
  @ApiOperation({ summary: 'Record vitals for an encounter' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('encounterId') encounterId: string,
    @Body() dto: CreateVitalDto,
  ) {
    return this.vitals.create(user, encounterId, dto);
  }

  @Get('encounters/:encounterId/vitals')
  @ApiOperation({ summary: 'List vitals for an encounter' })
  list(@CurrentUser() user: AuthenticatedUser, @Param('encounterId') encounterId: string) {
    return this.vitals.list(user, encounterId);
  }

  @Patch('vitals/:vitalId')
  @ApiOperation({ summary: 'Update a vital record' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('vitalId') vitalId: string,
    @Body() dto: UpdateVitalDto,
  ) {
    return this.vitals.update(user, vitalId, dto);
  }

  @Get('patients/:patientId/vitals')
  @ApiOperation({ summary: 'List all vitals for a patient' })
  listForPatient(@CurrentUser() user: AuthenticatedUser, @Param('patientId') patientId: string) {
    return this.vitals.listForPatient(user, patientId);
  }
}
