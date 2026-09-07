import { Transform } from 'class-transformer';
import { IsNumber, IsString, MaxLength, Min, MinLength } from 'class-validator';

const trim = ({ value }: { value: string | undefined }) => value?.trim();

export class RefundPaymentDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  @Transform(trim)
  reason!: string;
}
