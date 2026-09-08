import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, Matches } from 'class-validator';
import { normalizeBangladeshPhone } from '@common/utils/bangladesh-phone.util';

export class RequestPasswordResetDto {
  @IsString()
  @Matches(/^(?:\+8801|8801|01)[3-9]\d{8}$/)
  @Transform(({ value }: { value: string }) => normalizeBangladeshPhone(value))
  phone!: string;

  @IsOptional()
  @IsIn(['sms', 'email'])
  otpChannel: 'sms' | 'email' = 'sms';
}
