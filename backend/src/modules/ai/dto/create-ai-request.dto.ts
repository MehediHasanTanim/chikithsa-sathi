import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: string | undefined }) => value?.trim();

export class CreateAIRequestDto {
  @IsUUID()
  chamberId!: string;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(trim)
  feature?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  @Transform(trim)
  prompt!: string;
}
