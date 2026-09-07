import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { PrescriptionItemDto } from './create-prescription.dto';

const trim = ({ value }: { value: string | undefined }) => value?.trim();

export class AmendPrescriptionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  @Transform(trim)
  reason!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  items?: PrescriptionItemDto[];
}
