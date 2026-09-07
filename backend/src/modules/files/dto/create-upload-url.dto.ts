import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { FileCategory } from '@prisma/client';

const trim = ({ value }: { value: string | undefined }) => value?.trim();

export class CreateUploadUrlDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @Transform(trim)
  fileName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(150)
  @Transform(trim)
  contentType!: string;

  @IsInt()
  @Min(1)
  @Max(10_485_760)
  sizeBytes!: number;

  @IsOptional()
  @IsEnum(FileCategory)
  category?: FileCategory;
}
