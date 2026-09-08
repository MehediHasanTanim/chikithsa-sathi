import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class AnalyticsDashboardQueryDto {
  @IsUUID()
  chamberId!: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}
