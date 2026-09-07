import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { AIOrchestratorService } from './ai-orchestrator.service';
import type { CreateAIRequestDto } from './dto/create-ai-request.dto';

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'ai', version: '1' })
export class AIController {
  constructor(private readonly ai: AIOrchestratorService) {}

  @Post('requests')
  @ApiOperation({ summary: 'Generate a review-required AI assistance draft' })
  generate(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAIRequestDto) {
    return this.ai.generate(user, dto);
  }
}
