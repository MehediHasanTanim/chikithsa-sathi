import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

const trim = ({ value }: { value: string | undefined }) => value?.trim();

export class UpdateEncounterDto {
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @Transform(trim)
  chiefComplaint?: string;
}
