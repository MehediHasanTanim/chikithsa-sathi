import { Transform } from 'class-transformer';
import { IsDateString, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: string | undefined }) => value?.trim();

export class CreatePatientConditionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @Transform(trim)
  condition!: string;

  @IsOptional()
  @IsDateString()
  diagnosedAt?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'RESOLVED', 'CHRONIC', 'IN_REMISSION'])
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(trim)
  notes?: string;
}
