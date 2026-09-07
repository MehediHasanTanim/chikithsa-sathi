import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { DurationUnit, MedicineFrequency, PrescriptionItemType } from '@prisma/client';

const trim = ({ value }: { value: string | undefined }) => value?.trim();

export class PrescriptionItemDto {
  @IsOptional()
  @IsUUID()
  medicineId?: string;

  @IsOptional()
  @IsEnum(PrescriptionItemType)
  itemType?: PrescriptionItemType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(trim)
  medicineName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trim)
  strength?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trim)
  dosageForm?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trim)
  dosage?: string;

  @IsOptional()
  @IsEnum(MedicineFrequency)
  frequency?: MedicineFrequency;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(trim)
  frequencyText?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  duration?: number;

  @IsOptional()
  @IsEnum(DurationUnit)
  durationUnit?: DurationUnit;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trim)
  route?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(trim)
  instructions?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(trim)
  instructionsBangla?: string;
}

export class CreatePrescriptionDto {
  @IsOptional()
  @IsIn(['bn', 'en'])
  language?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @Transform(trim)
  clinicalSummary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @Transform(trim)
  advice?: string;

  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  items?: PrescriptionItemDto[];
}
