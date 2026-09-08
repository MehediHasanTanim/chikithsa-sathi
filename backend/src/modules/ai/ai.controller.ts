import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { AIClinicalFeaturesService } from './ai-clinical-features.service';
import { AIOrchestratorService } from './ai-orchestrator.service';
import { CreateAIPrescriptionDraftDto } from './dto/create-ai-prescription-draft.dto';
import { CreateAIRequestDto } from './dto/create-ai-request.dto';
import { CreateClinicalChatDto } from './dto/create-clinical-chat.dto';
import { CreatePatientSummaryDto } from './dto/create-patient-summary.dto';

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'ai', version: '1' })
export class AIController {
  constructor(
    private readonly ai: AIOrchestratorService,
    private readonly clinical: AIClinicalFeaturesService,
  ) {}

  @Post('requests')
  @ApiOperation({ summary: 'Generate a review-required AI assistance draft' })
  generate(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAIRequestDto) {
    return this.ai.generate(user, dto);
  }

  @Post('patient-summary')
  @ApiOperation({ summary: 'Generate a structured, review-required patient summary' })
  patientSummary(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePatientSummaryDto) {
    return this.clinical.patientSummary(user, dto);
  }

  @Post('clinical-chat')
  @ApiOperation({ summary: 'Ask a safety-constrained clinical question about a patient' })
  clinicalChat(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateClinicalChatDto) {
    return this.clinical.clinicalChat(user, dto);
  }

  @Post('prescription-draft')
  @ApiOperation({ summary: 'Create an AI-assisted prescription draft requiring clinician review' })
  prescriptionDraft(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAIPrescriptionDraftDto,
  ) {
    return this.clinical.prescriptionDraft(user, dto);
  }
}
