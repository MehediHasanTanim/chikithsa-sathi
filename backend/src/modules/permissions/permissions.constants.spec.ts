import { PERMISSION_CODES, ROLE_PERMISSIONS } from './permissions.constants';

describe('Role permission matrix', () => {
  it('grants every permission to DOCTOR', () => {
    expect(new Set(ROLE_PERMISSIONS.DOCTOR).size).toBe(PERMISSION_CODES.length);
  });

  it('lets ASSISTANT_DOCTOR draft but not finalize prescriptions', () => {
    expect(ROLE_PERMISSIONS.ASSISTANT_DOCTOR).toContain('prescriptions.create');
    expect(ROLE_PERMISSIONS.ASSISTANT_DOCTOR).not.toContain('prescriptions.finalize');
  });

  it('gives RECEPTIONIST queue and payment access but no clinical access', () => {
    expect(ROLE_PERMISSIONS.RECEPTIONIST).toContain('queue.manage');
    expect(ROLE_PERMISSIONS.RECEPTIONIST).toContain('payments.create');
    expect(ROLE_PERMISSIONS.RECEPTIONIST).not.toContain('encounters.read');
    expect(ROLE_PERMISSIONS.RECEPTIONIST).not.toContain('prescriptions.create');
  });

  it('gives BILLING_STAFF payment access but no clinical or staff access', () => {
    expect(ROLE_PERMISSIONS.BILLING_STAFF).toContain('payments.create');
    expect(ROLE_PERMISSIONS.BILLING_STAFF).not.toContain('encounters.read');
    expect(ROLE_PERMISSIONS.BILLING_STAFF).not.toContain('staff.manage');
  });

  it('lets CHAMBER_MANAGER manage staff but not finalize prescriptions', () => {
    expect(ROLE_PERMISSIONS.CHAMBER_MANAGER).toContain('staff.manage');
    expect(ROLE_PERMISSIONS.CHAMBER_MANAGER).not.toContain('prescriptions.finalize');
  });
});
