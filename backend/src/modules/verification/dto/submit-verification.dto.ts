import { Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

const trim = ({ value }: { value: string | undefined }) => value?.trim();

export class VerificationDocumentDto {
  @IsUUID()
  fileId!: string;

  @IsString()
  @MaxLength(100)
  @Transform(trim)
  type!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(trim)
  fileName?: string;
}

export class SubmitVerificationDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trim)
  bmdcNumber?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => VerificationDocumentDto)
  documents!: VerificationDocumentDto[];
}
