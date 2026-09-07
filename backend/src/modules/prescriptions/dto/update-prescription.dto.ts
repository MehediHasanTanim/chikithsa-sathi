import { Transform } from 'class-transformer';
import { IsDateString, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const trim = ({ value }: { value: string | undefined }) => value?.trim();

export class UpdatePrescriptionDto {
  @IsOptional()
  @IsIn(['bn', 'en'])
  language?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @Transform(trim)
  clinicalSummary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @Transform(trim)
  advice?: string;

  @IsOptional()
  @IsDateString()
  followUpDate?: string;
}
