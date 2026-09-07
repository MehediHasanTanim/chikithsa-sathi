import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: string | undefined }) => value?.trim();

export class CreatePatientAllergyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @Transform(trim)
  allergen!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(trim)
  reaction?: string;

  @IsOptional()
  @IsIn(['MILD', 'MODERATE', 'SEVERE'])
  severity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(trim)
  notes?: string;
}
