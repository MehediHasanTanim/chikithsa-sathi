import { IsEnum, IsOptional } from 'class-validator';
import { MembershipStatus, UserRole } from '@prisma/client';

export class UpdateStaffDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(MembershipStatus)
  status?: MembershipStatus;
}
