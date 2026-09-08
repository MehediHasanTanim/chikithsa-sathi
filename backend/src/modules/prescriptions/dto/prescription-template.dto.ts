import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min, ValidateNested } from 'class-validator';

class TemplateItemDto {
  @IsOptional() @IsUUID() medicineId?: string;
  @IsOptional() @IsString() @MaxLength(255) medicineName?: string;
  @IsOptional() @IsString() @MaxLength(100) strength?: string;
  @IsOptional() @IsString() @MaxLength(100) dosage?: string;
  @IsOptional() @IsString() @MaxLength(255) frequencyText?: string;
  @IsOptional() @IsInt() @Min(1) durationDays?: number;
  @IsOptional() @IsString() @MaxLength(2000) instruction?: string;
}

export class CreatePrescriptionTemplateDto {
  @IsUUID() chamberId!: string;
  @IsString() @MaxLength(150) name!: string;
  @IsOptional() @IsString() @MaxLength(5000) clinicalSummary?: string;
  @IsOptional() @IsString() @MaxLength(5000) advice?: string;
  @IsOptional() @IsInt() @Min(1) followUpDays?: number;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => TemplateItemDto) items?: TemplateItemDto[];
}

export class UpdatePrescriptionTemplateDto {
  @IsOptional() @IsString() @MaxLength(150) name?: string;
  @IsOptional() @IsString() @MaxLength(5000) clinicalSummary?: string;
  @IsOptional() @IsString() @MaxLength(5000) advice?: string;
  @IsOptional() @IsInt() @Min(1) followUpDays?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => TemplateItemDto) items?: TemplateItemDto[];
}
