import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

const trim = ({ value }: { value: string | undefined }) => value?.trim();

export class SkipQueueEntryDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(trim)
  reason?: string;
}
