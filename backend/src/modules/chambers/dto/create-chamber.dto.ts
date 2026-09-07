import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

const trim = ({ value }: { value: string | undefined }) => value?.trim();

export class ChamberAddressDto {
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

export class CreateChamberDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Transform(trim)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(trim)
  nameBangla?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ChamberAddressDto)
  address?: ChamberAddressDto;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Transform(trim)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  @Transform(trim)
  email?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  consultationFee?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  @Transform(trim)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trim)
  timezone?: string;
}
