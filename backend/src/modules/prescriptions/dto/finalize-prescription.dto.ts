import { IsBoolean } from 'class-validator';

export class FinalizePrescriptionDto {
  @IsBoolean()
  confirmation!: boolean;
}
