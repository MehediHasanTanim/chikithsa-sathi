import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';

@ApiTags('Prescriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class PrescriptionsController {
  constructor(private readonly prescriptions: PrescriptionsService) {}

  @Post('encounters/:encounterId/prescriptions')
  @ApiOperation({ summary: 'Create a draft prescription for an encounter' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('encounterId') encounterId: string,
    @Body() dto: CreatePrescriptionDto,
  ) {
    return this.prescriptions.create(user, encounterId, dto);
  }

  @Get('prescriptions/:prescriptionId')
  @ApiOperation({ summary: 'Get a prescription' })
  get(@CurrentUser() user: AuthenticatedUser, @Param('prescriptionId') prescriptionId: string) {
    return this.prescriptions.get(user, prescriptionId);
  }

  @Patch('prescriptions/:prescriptionId')
  @ApiOperation({ summary: 'Update a draft prescription' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('prescriptionId') prescriptionId: string,
    @Body() dto: UpdatePrescriptionDto,
  ) {
    return this.prescriptions.update(user, prescriptionId, dto);
  }
}
