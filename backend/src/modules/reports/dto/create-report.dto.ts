import { Transform } from 'class-transformer';
import { IsDateString, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: string | undefined }) => value?.trim();

export class CreateReportDto {
  @IsOptional()
  @IsUUID()
  investigationId?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @Transform(trim)
  title!: string;

  @IsOptional()
  @IsDateString()
  reportDate?: string;

  @IsOptional()
  @IsUUID()
  fileId?: string;

  @IsOptional() @IsString() @MaxLength(10000) @Transform(trim)
  summary?: string;

  @IsOptional() @IsString() @MaxLength(20000) @Transform(trim)
  findings?: string;

  @IsOptional() @IsString() @MaxLength(20000) @Transform(trim)
  interpretation?: string;
}
