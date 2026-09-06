import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }: { value: string | undefined }) => value?.trim())
  fullName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  @Transform(({ value }: { value: string | undefined }) => value?.trim().toLowerCase())
  email?: string;

  @IsOptional()
  @IsIn(['bn', 'en'])
  preferredLanguage?: 'bn' | 'en';
}
