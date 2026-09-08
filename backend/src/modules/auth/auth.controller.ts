import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedUser, RequestContext } from './auth.types';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ConfirmPasswordResetDto } from './dto/confirm-password-reset.dto';

@ApiTags('Authentication')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register an account and issue an OTP challenge' })
  register(@Body() dto: RegisterDto, @Req() request: FastifyRequest) {
    return this.auth.register(dto, this.context(request));
  }

  @Get('onboarding')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get authenticated user onboarding progress' })
  onboarding(@CurrentUser() user: AuthenticatedUser) { return this.auth.onboarding(user); }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a registration OTP' })
  verifyOtp(@Body() dto: VerifyOtpDto, @Req() request: FastifyRequest) {
    return this.auth.verifyOtp(dto.phone, dto.otp, this.context(request));
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a new registration OTP' })
  resendOtp(@Body() dto: ResendOtpDto, @Req() request: FastifyRequest) {
    return this.auth.resendOtp(dto.phone, this.context(request), dto.otpChannel);
  }

  @Post('password-reset/request')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Send a password-reset OTP by the selected registered channel' })
  requestPasswordReset(@Body() dto: RequestPasswordResetDto, @Req() request: FastifyRequest) {
    return this.auth.requestPasswordReset(dto.phone, this.context(request), dto.otpChannel);
  }

  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset a password with a valid mobile OTP' })
  confirmPasswordReset(@Body() dto: ConfirmPasswordResetDto, @Req() request: FastifyRequest) {
    return this.auth.confirmPasswordReset(dto.phone, dto.otp, dto.password, this.context(request));
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate and create a session' })
  login(@Body() dto: LoginDto, @Req() request: FastifyRequest) {
    return this.auth.login(dto, this.context(request));
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate a session refresh token' })
  refresh(@Body() dto: RefreshTokenDto, @Req() request: FastifyRequest) {
    return this.auth.refresh(dto.refreshToken, this.context(request));
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke the current session' })
  logout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: LogoutDto,
    @Req() request: FastifyRequest,
  ) {
    return this.auth.logout(user, dto.refreshToken, this.context(request));
  }

  private context(request: FastifyRequest): RequestContext {
    const userAgentHeader = request.headers['user-agent'];
    const userAgent =
      typeof userAgentHeader === 'string'
        ? userAgentHeader
        : Array.isArray(userAgentHeader)
          ? userAgentHeader[0]
          : undefined;
    return {
      requestId: request.requestId,
      ipAddress: request.ip,
      userAgent,
    };
  }
}
