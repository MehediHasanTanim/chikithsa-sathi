import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { normalizeBangladeshPhone } from '@common/utils/bangladesh-phone.util';

const trim = ({ value }: { value: string | undefined }) => value?.trim();

const BD_PHONE = /^(?:\+8801|8801|01)[3-9]\d{8}$/;

export class PatientAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(trim)
  line1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(trim)
  line2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  @Transform(trim)
  area?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trim)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trim)
  district?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trim)
  division?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Transform(trim)
  postalCode?: string;
}

export class CreatePatientDto {
  @IsUUID()
  chamberId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Transform(trim)
  fullName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(trim)
  nameBangla?: string;

  @IsOptional()
  @IsString()
  @Matches(BD_PHONE)
  @Transform(({ value }: { value: string }) => normalizeBangladeshPhone(value))
  phone?: string;

  @IsOptional()
  @IsString()
  @Matches(BD_PHONE)
  @Transform(({ value }: { value: string }) => normalizeBangladeshPhone(value))
  alternatePhone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  @Transform(trim)
  email?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsIn(['MALE', 'FEMALE', 'OTHER'])
  gender?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  @Transform(trim)
  bloodGroup?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trim)
  nationalId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PatientAddressDto)
  address?: PatientAddressDto;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(trim)
  emergencyName?: string;

  @IsOptional()
  @IsString()
  @Matches(BD_PHONE)
  @Transform(({ value }: { value: string }) => normalizeBangladeshPhone(value))
  emergencyPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trim)
  emergencyRelation?: string;
}
