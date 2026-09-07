import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { DiagnosisType } from '@prisma/client';

const trim = ({ value }: { value: string | undefined }) => value?.trim();

export class AssignDiagnosisDto {
  @IsUUID()
  diagnosisId!: string;

  @IsOptional()
  @IsEnum(DiagnosisType)
  type?: DiagnosisType;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(trim)
  notes?: string;
}
