import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { QueueStatus } from '@prisma/client';

export class QueueQueryDto {
  @IsUUID()
  chamberId!: string;

  @IsOptional()
  @IsEnum(QueueStatus)
  status?: QueueStatus;
}
