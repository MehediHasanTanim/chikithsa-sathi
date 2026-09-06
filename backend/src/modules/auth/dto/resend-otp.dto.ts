import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';

import { normalizeBangladeshPhone } from '@common/utils/bangladesh-phone.util';

export class ResendOtpDto {
  @IsString()
  @Matches(/^(?:\+8801|8801|01)[3-9]\d{8}$/)
  @Transform(({ value }: { value: string }) => normalizeBangladeshPhone(value))
  phone!: string;
}
