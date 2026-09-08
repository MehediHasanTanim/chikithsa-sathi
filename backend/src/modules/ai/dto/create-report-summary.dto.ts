import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateReportSummaryDto {
  @IsUUID() chamberId!: string;
  @IsUUID() reportId!: string;
  @IsOptional() @IsString() @MaxLength(1000) focus?: string;
}
