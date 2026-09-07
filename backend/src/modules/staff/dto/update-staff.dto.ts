import { IsIn, IsEnum, IsOptional } from 'class-validator';
import { MembershipStatus, UserRole } from '@prisma/client';

import { STAFF_ROLES } from '../staff.constants';

export class UpdateStaffDto {
  @IsOptional()
  @IsIn(STAFF_ROLES)
  role?: UserRole;

  @IsOptional()
  @IsEnum(MembershipStatus)
  status?: MembershipStatus;
}
