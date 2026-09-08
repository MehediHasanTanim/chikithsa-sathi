import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { PrescriptionsService } from './prescriptions.service';
import { AmendPrescriptionDto } from './dto/amend-prescription.dto';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { FinalizePrescriptionDto } from './dto/finalize-prescription.dto';
import { ReviewPrescriptionDto } from './dto/review-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';

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

  @Post('prescriptions/:prescriptionId/review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit a draft prescription for review' })
  review(
    @CurrentUser() user: AuthenticatedUser,
    @Param('prescriptionId') prescriptionId: string,
    @Body() dto: ReviewPrescriptionDto,
  ) {
    return this.prescriptions.review(user, prescriptionId, dto);
  }

  @Post('prescriptions/:prescriptionId/finalize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Finalize a reviewed prescription' })
  finalize(
    @CurrentUser() user: AuthenticatedUser,
    @Param('prescriptionId') prescriptionId: string,
    @Body() dto: FinalizePrescriptionDto,
  ) {
    return this.prescriptions.finalize(user, prescriptionId, dto);
  }

  @Post('prescriptions/:prescriptionId/deliver')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a finalized prescription as delivered' })
  deliver(@CurrentUser() user: AuthenticatedUser, @Param('prescriptionId') prescriptionId: string) {
    return this.prescriptions.deliver(user, prescriptionId);
  }

  @Post('prescriptions/:prescriptionId/amend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Amend a finalized prescription' })
  amend(
    @CurrentUser() user: AuthenticatedUser,
    @Param('prescriptionId') prescriptionId: string,
    @Body() dto: AmendPrescriptionDto,
  ) {
    return this.prescriptions.amend(user, prescriptionId, dto);
  }

  @Get('prescriptions/:prescriptionId/history')
  @ApiOperation({ summary: 'Get a prescription amendment history' })
  history(@CurrentUser() user: AuthenticatedUser, @Param('prescriptionId') prescriptionId: string) {
    return this.prescriptions.history(user, prescriptionId);
  }

  @Get('prescriptions/:prescriptionId/pdf')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Request a prescription PDF (queued for generation)' })
  pdf(@CurrentUser() user: AuthenticatedUser, @Param('prescriptionId') prescriptionId: string) {
    return this.prescriptions.pdf(user, prescriptionId);
  }

  @Post('prescriptions/:prescriptionId/follow-up')
  @ApiOperation({ summary: 'Create a follow-up appointment from a prescription' })
  followUp(@CurrentUser() user: AuthenticatedUser, @Param('prescriptionId') prescriptionId: string, @Body() dto: CreateFollowUpDto) { return this.prescriptions.createFollowUp(user, prescriptionId, dto); }
}
