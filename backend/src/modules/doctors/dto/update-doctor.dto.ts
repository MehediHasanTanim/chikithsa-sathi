import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

const trim = ({ value }: { value: string | undefined }) => value?.trim();

export class UpdateDoctorDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(trim)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(trim)
  nameBangla?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(trim)
  designation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @Transform(trim)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @Transform(trim)
  bioBangla?: string;
}
