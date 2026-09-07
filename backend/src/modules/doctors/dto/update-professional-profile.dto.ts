import { Transform } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const trim = ({ value }: { value: string | undefined }) => value?.trim();

export class UpdateProfessionalProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(trim)
  specialization?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(trim)
  subSpecialization?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  qualifications?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(trim)
  medicalCollege?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trim)
  bmdcNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(trim)
  registrationAuthority?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  yearsOfExperience?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  consultationFee?: number;
}
