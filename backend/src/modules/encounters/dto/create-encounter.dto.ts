import { IsOptional, IsUUID } from 'class-validator';

export class CreateEncounterDto {
  @IsUUID()
  chamberId!: string;

  @IsUUID()
  patientId!: string;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @IsOptional()
  @IsUUID()
  queueEntryId?: string;
}
