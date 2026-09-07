import { Transform } from 'class-transformer';
import { IsEnum, IsISO8601, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { AppointmentType } from '@prisma/client';

const trim = ({ value }: { value: string | undefined }) => value?.trim();

export class CreateAppointmentDto {
  @IsUUID()
  chamberId!: string;

  @IsUUID()
  patientId!: string;

  @IsISO8601()
  scheduledAt!: string;

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
