import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuditService } from './services/audit.service';
import { AuthRateLimitService } from './services/auth-rate-limit.service';
import {
  createOtpEmailTransport,
  OtpDeliveryService,
  OTP_EMAIL_TRANSPORT,
} from './services/otp-delivery.service';
import { OtpService } from './services/otp.service';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    TokenService,
    {
      provide: OTP_EMAIL_TRANSPORT,
      inject: [ConfigService],
      useFactory: createOtpEmailTransport,
    },
    OtpService,
    OtpDeliveryService,
    AuthRateLimitService,
    AuditService,
    JwtStrategy,
    JwtAuthGuard,
  ],
  exports: [JwtAuthGuard, AuditService],
})
export class AuthModule {}
