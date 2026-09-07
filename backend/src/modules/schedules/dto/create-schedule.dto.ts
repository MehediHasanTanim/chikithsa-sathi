import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const trim = ({ value }: { value: string | undefined }) => value?.trim();

export class ScheduleBreakDto {
  @IsString()
  @Matches(TIME_PATTERN, { message: 'startTime must use HH:mm format' })
  startTime!: string;

  @IsString()
  @Matches(TIME_PATTERN, { message: 'endTime must use HH:mm format' })
  endTime!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(trim)
  reason?: string;
}

export class CreateScheduleDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @IsString()
  @Matches(TIME_PATTERN, { message: 'startTime must use HH:mm format' })
  startTime!: string;

  @IsString()
  @Matches(TIME_PATTERN, { message: 'endTime must use HH:mm format' })
  endTime!: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(180)
  slotDurationMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  maxPatients?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleBreakDto)
  breaks?: ScheduleBreakDto[];
}
