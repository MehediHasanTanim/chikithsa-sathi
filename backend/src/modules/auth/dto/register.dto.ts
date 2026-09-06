import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { normalizeBangladeshPhone } from '@common/utils/bangladesh-phone.util';

export class RegisterDto {
  @IsString()
  @Matches(/^(?:\+8801|8801|01)[3-9]\d{8}$/, {
    message: 'phone must be a valid Bangladesh mobile number',
  })
  @Transform(({ value }: { value: string }) => normalizeBangladeshPhone(value))
  phone!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  @Transform(({ value }: { value: string | undefined }) => value?.trim().toLowerCase())
  email?: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(({ value }: { value: string }) => value.trim())
  fullName!: string;

  @IsOptional()
  @IsIn(['bn', 'en'])
  preferredLanguage: 'bn' | 'en' = 'bn';
}
