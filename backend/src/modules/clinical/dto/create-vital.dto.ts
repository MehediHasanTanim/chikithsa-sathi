import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class CreateVitalDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(500)
  weightKg?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(300)
  heightCm?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(400)
  systolicBp?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(400)
  diastolicBp?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(400)
  pulseBpm?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(20)
  @Max(45)
  temperatureC?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(100)
  spo2?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(200)
  respiratoryRate?: number;
}
