import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: string | undefined }) => value?.trim();

export class CreateInvestigationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @Transform(trim)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(trim)
  nameBangla?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trim)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(trim)
  instructions?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(trim)
  notes?: string;
}
