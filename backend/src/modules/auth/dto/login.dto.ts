import { Transform, Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { normalizeBangladeshPhone } from '@common/utils/bangladesh-phone.util';

export class LoginDeviceDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  deviceId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  platform?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  appVersion?: string;
}

export class LoginDto {
  @IsString()
  @Matches(/^(?:\+8801|8801|01)[3-9]\d{8}$/)
  @Transform(({ value }: { value: string }) => normalizeBangladeshPhone(value))
  phone!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LoginDeviceDto)
  device?: LoginDeviceDto;
}
