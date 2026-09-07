import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { SubmitVerificationDto } from './dto/submit-verification.dto';
import { VerificationService } from './verification.service';

@ApiTags('Verification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'verification', version: '1' })
export class VerificationController {
  constructor(private readonly verification: VerificationService) {}

  @Post('submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit professional verification' })
  submit(@CurrentUser() user: AuthenticatedUser, @Body() dto: SubmitVerificationDto) {
    return this.verification.submit(user, dto);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get the current verification status' })
  status(@CurrentUser() user: AuthenticatedUser) {
    return this.verification.status(user);
  }
}
