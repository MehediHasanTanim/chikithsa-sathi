import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Matches,
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

  /** Base64-encoded SHA-256 digest; used by S3 and completion verification. */
  @IsString()
  @Matches(/^[A-Za-z0-9+/]{43}=$/, {
    message: 'checksumSha256 must be a base64-encoded SHA-256 digest',
  })
  checksumSha256!: string;

  @IsOptional()
  @IsEnum(FileCategory)
  category?: FileCategory;
}
