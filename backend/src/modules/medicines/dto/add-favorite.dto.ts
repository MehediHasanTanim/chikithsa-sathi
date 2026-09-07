import { IsUUID } from 'class-validator';

export class AddFavoriteDto {
  @IsUUID()
  medicineId!: string;
}
