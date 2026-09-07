import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { InvestigationStatus } from '@prisma/client';

const trim = ({ value }: { value: string | undefined }) => value?.trim();

export class UpdateInvestigationDto {
  @IsOptional()
  @IsEnum(InvestigationStatus)
  status?: InvestigationStatus;

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
