import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { AppointmentType } from '@prisma/client';

const trim = ({ value }: { value: string | undefined }) => value?.trim();

export class UpdateAppointmentDto {
  @IsOptional()
  @IsEnum(AppointmentType)
  type?: AppointmentType;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(trim)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(trim)
  notes?: string;
}
