import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ClinicalNoteType } from '@prisma/client';

const trim = ({ value }: { value: string | undefined }) => value?.trim();

export class CreateClinicalNoteDto {
  @IsEnum(ClinicalNoteType)
  type!: ClinicalNoteType;

  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  @Transform(trim)
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  @Transform(trim)
  contentBangla?: string;
}
