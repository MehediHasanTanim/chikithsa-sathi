import type { UserRole } from '@prisma/client';

/**
 * Canonical permission catalogue for the MVP. Seeded into the `Permission`
 * table by `prisma/seed.ts`; DOCTOR and PLATFORM_ADMIN are granted all codes.
 */
export const PERMISSIONS = {
  'patients.read': 'View patient profiles',
  'patients.create': 'Register new patients',
  'patients.update': 'Edit patient demographic data',
  'appointments.read': 'View appointments',
  'appointments.create': 'Create appointments',
  'appointments.update': 'Reschedule or cancel appointments',
  'queue.read': 'View the daily queue',
  'queue.manage': 'Manage the daily queue',
  'encounters.read': 'View clinical encounters',
  'encounters.create': 'Start clinical encounters',
  'encounters.update': 'Edit clinical encounters',
  'prescriptions.create': 'Create prescription drafts',
  'prescriptions.finalize': 'Finalize prescriptions',
  'payments.create': 'Record payments',
  'payments.read': 'View payments',
  'payments.refund': 'Refund payments',
  'staff.read': 'View chamber staff',
  'staff.invite': 'Invite staff to a chamber',
  'staff.manage': 'Change or remove staff',
} as const;

export const PERMISSION_CODES = Object.keys(PERMISSIONS);

/**
 * Default role → permission mapping, mirroring the role & permission matrix.
 * `CHAMBER_MANAGER` may only grant permissions they themselves hold.
 */
export const ROLE_PERMISSIONS: Record<UserRole, readonly string[]> = {
  DOCTOR: PERMISSION_CODES,
  ASSISTANT_DOCTOR: [
    'patients.read',
    'patients.create',
    'patients.update',
    'appointments.read',
    'appointments.create',
    'appointments.update',
    'queue.read',
    'encounters.read',
    'encounters.create',
    'encounters.update',
    'prescriptions.create',
  ],
  RECEPTIONIST: [
    'patients.read',
    'patients.create',
    'patients.update',
    'appointments.read',
    'appointments.create',
    'appointments.update',
    'queue.read',
    'queue.manage',
    'payments.create',
    'payments.read',
  ],
  CHAMBER_MANAGER: [
    'patients.read',
    'patients.create',
    'patients.update',
    'appointments.read',
    'appointments.create',
    'appointments.update',
    'queue.read',
    'queue.manage',
    'payments.read',
    'staff.read',
    'staff.invite',
    'staff.manage',
  ],
  BILLING_STAFF: [
    'patients.read',
    'appointments.read',
    'payments.create',
    'payments.read',
    'payments.refund',
  ],
  PLATFORM_ADMIN: PERMISSION_CODES,
};
