import { MembershipStatus, UserRole } from '@prisma/client';

import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { ChambersService } from './chambers.service';

const user = { id: 'user-1' } as AuthenticatedUser;

const doctorProfile = { id: 'doctor-1', userId: 'user-1', fullName: 'Dr. Rahman' };

const chamberRecord = {
  id: 'chamber-1',
  ownerDoctorId: 'doctor-1',
  name: 'Dhanmondi Chamber',
  nameBangla: null,
  chamberCode: 'CH-ABCD2345',
  addressLine1: null,
  addressLine2: null,
  area: null,
  city: null,
  district: null,
  division: null,
  postalCode: null,
  phone: null,
  email: null,
  status: 'ACTIVE',
  defaultCurrency: 'BDT',
  timezone: 'Asia/Dhaka',
  consultationFee: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('ChambersService', () => {
  const tx = {
    chamber: { create: jest.fn() },
    chamberMembership: { create: jest.fn() },
  };
  const prisma = {
    transaction: jest.fn(),
    chamber: { findMany: jest.fn(), update: jest.fn() },
  };
  const doctors = { getOrCreateProfile: jest.fn().mockResolvedValue(doctorProfile) };
  const service = new ChambersService(prisma as never, doctors as never);

  beforeEach(() => {
    jest.resetAllMocks();
    doctors.getOrCreateProfile.mockResolvedValue(doctorProfile);
    prisma.transaction.mockImplementation((callback: (client: typeof tx) => unknown) =>
      Promise.resolve(callback(tx)),
    );
  });

  it('creates a chamber and an active owner membership', async () => {
    tx.chamber.create.mockResolvedValue(chamberRecord);
    tx.chamberMembership.create.mockResolvedValue({ id: 'membership-1' });

    const result = await service.create(user, { name: 'Dhanmondi Chamber' });

    expect(tx.chamber.create).toHaveBeenCalledTimes(1);
    const membershipArgs = (
      tx.chamberMembership.create.mock.calls as Array<
        [{ data: { chamberId: string; userId: string; role: UserRole; status: MembershipStatus } }]
      >
    )[0]![0];
    expect(membershipArgs.data).toMatchObject({
      chamberId: 'chamber-1',
      userId: 'user-1',
      role: UserRole.DOCTOR,
      status: MembershipStatus.ACTIVE,
    });
    expect(result).toMatchObject({
      id: 'chamber-1',
      name: 'Dhanmondi Chamber',
      owner: { id: 'doctor-1', fullName: 'Dr. Rahman' },
    });
  });

  it('maps a chamber with a numeric consultation fee', async () => {
    tx.chamber.create.mockResolvedValue({ ...chamberRecord, consultationFee: 1000 });

    const result = await service.create(user, { name: 'Dhanmondi Chamber', consultationFee: 1000 });

    expect(result.consultationFee).toBe(1000);
  });

  it('lists chambers owned by or shared with the user', async () => {
    prisma.chamber.findMany.mockResolvedValue([
      { ...chamberRecord, owner: { id: 'doctor-1', fullName: 'Dr. Rahman' } },
    ]);

    const result = await service.list(user);

    expect(prisma.chamber.findMany).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'chamber-1', status: 'ACTIVE' });
  });
});
