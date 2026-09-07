import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

const trim = ({ value }: { value: string | undefined }) => value?.trim();

export class CreatePatientSummaryDto {
  @IsUUID()
  chamberId!: string;

  @IsUUID()
  patientId!: string;

  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(trim)
  focus?: string;
}
