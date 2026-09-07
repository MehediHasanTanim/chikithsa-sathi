import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

const trim = ({ value }: { value: string | undefined }) => value?.trim();

export class AssociateChamberDto {
  @IsUUID()
  chamberId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(trim)
  notes?: string;
}
