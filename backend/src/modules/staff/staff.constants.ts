import { UserRole } from '@prisma/client';

/** Roles that may be assigned to non-owner chamber staff. */
export const STAFF_ROLES = [
  UserRole.ASSISTANT_DOCTOR,
  UserRole.RECEPTIONIST,
  UserRole.CHAMBER_MANAGER,
  UserRole.BILLING_STAFF,
] as const;

const staffRoleSet = new Set<UserRole>(STAFF_ROLES);

export function isStaffRole(role: UserRole): boolean {
  return staffRoleSet.has(role);
}
