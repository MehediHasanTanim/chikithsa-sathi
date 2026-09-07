import { IsBoolean, IsOptional } from 'class-validator';

export class ReviewPrescriptionDto {
  @IsOptional()
  @IsBoolean()
  reviewed?: boolean;
}
