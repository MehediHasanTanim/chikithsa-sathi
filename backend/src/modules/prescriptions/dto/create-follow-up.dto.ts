import { IsDateString } from 'class-validator';
export class CreateFollowUpDto { @IsDateString() scheduledAt!: string; }
