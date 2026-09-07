import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

const trim = ({ value }: { value: string | undefined }) => value?.trim();

export class CreateAIPrescriptionDraftDto {
  @IsUUID()
  chamberId!: string;

  @IsUUID()
  encounterId!: string;

  @IsUUID()
  patientId!: string;

  @IsOptional()
  @IsIn(['bn', 'en'])
  language?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(trim)
  focus?: string;
}
