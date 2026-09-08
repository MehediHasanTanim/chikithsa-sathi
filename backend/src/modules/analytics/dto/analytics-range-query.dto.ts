import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class AnalyticsRangeQueryDto {
  @IsUUID()
  chamberId!: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
