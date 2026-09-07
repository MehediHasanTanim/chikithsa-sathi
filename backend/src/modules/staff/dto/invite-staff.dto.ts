import { Transform } from 'class-transformer';
import { IsIn, IsString, Matches } from 'class-validator';
import { UserRole } from '@prisma/client';

import { normalizeBangladeshPhone } from '@common/utils/bangladesh-phone.util';
import { STAFF_ROLES } from '../staff.constants';

export class InviteStaffDto {
  @IsString()
  @Matches(/^(?:\+8801|8801|01)[3-9]\d{8}$/)
  @Transform(({ value }: { value: string }) => normalizeBangladeshPhone(value))
  phone!: string;

  @IsIn(STAFF_ROLES)
  role!: UserRole;
}
