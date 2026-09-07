import { IsOptional, IsUUID } from 'class-validator';

export class CheckInDto {
  @IsUUID()
  chamberId!: string;

  @IsUUID()
  patientId!: string;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;
}
