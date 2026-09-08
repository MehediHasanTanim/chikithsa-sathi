import { Transform } from 'class-transformer';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { normalizeBangladeshPhone } from '@common/utils/bangladesh-phone.util';

export class ConfirmPasswordResetDto {
  @IsString() @Matches(/^(?:\+8801|8801|01)[3-9]\d{8}$/) @Transform(({ value }: { value: string }) => normalizeBangladeshPhone(value)) phone!: string;
  @IsString() @Matches(/^\d{6}$/) otp!: string;
  @IsString() @MinLength(12) @MaxLength(128) password!: string;
}
