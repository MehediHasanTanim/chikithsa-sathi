import { ConflictException, Injectable } from '@nestjs/common';
import { ChamberStatus, MembershipStatus, Prisma, UserRole } from '@prisma/client';
import { randomInt } from 'node:crypto';

import { ErrorCode } from '@common/constants/error-codes';
import { PrismaService } from '@database/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { DoctorsService } from '@modules/doctors/doctors.service';
import type { ChamberWithOwner } from './services/chamber-access.service';
import type { CreateChamberDto } from './dto/create-chamber.dto';
import type { UpdateChamberDto } from './dto/update-chamber.dto';

export type PublicChamber = {
  id: string;
  name: string;
  nameBangla: string | null;
  chamberCode: string;
  address: {
    line1: string | null;
    line2: string | null;
    area: string | null;
    city: string | null;
    district: string | null;
    division: string | null;
    postalCode: string | null;
  };
  phone: string | null;
  email: string | null;
  status: string;
  currency: string;
  timezone: string;
  consultationFee: number | null;
  owner: { id: string; fullName: string };
  createdAt: Date;
  updatedAt: Date;
};

const CHAMBER_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

@Injectable()
export class ChambersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly doctors: DoctorsService,
  ) {}

  async create(user: AuthenticatedUser, dto: CreateChamberDto): Promise<PublicChamber> {
    const profile = await this.doctors.getOrCreateProfile(user.id);
    const chamber = await this.createWithRetry(profile.id, user.id, dto);
    return this.toPublic({
      ...chamber,
      owner: { id: profile.id, fullName: profile.fullName },
    });
  }

  async list(user: AuthenticatedUser): Promise<PublicChamber[]> {
    const chambers = await this.prisma.chamber.findMany({
      where: {
        OR: [
          { owner: { userId: user.id } },
          { memberships: { some: { userId: user.id, status: MembershipStatus.ACTIVE } } },
        ],
      },
      include: { owner: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return chambers.map((chamber) => this.toPublic(chamber));
  }

  async update(chamberId: string, dto: UpdateChamberDto): Promise<PublicChamber> {
    const chamber = await this.prisma.chamber.update({
      where: { id: chamberId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.nameBangla !== undefined ? { nameBangla: dto.nameBangla } : {}),
        ...(dto.address?.line1 !== undefined ? { addressLine1: dto.address.line1 } : {}),
        ...(dto.address?.line2 !== undefined ? { addressLine2: dto.address.line2 } : {}),
        ...(dto.address?.area !== undefined ? { area: dto.address.area } : {}),
        ...(dto.address?.city !== undefined ? { city: dto.address.city } : {}),
        ...(dto.address?.district !== undefined ? { district: dto.address.district } : {}),
        ...(dto.address?.division !== undefined ? { division: dto.address.division } : {}),
        ...(dto.address?.postalCode !== undefined ? { postalCode: dto.address.postalCode } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.consultationFee !== undefined
          ? { consultationFee: new Prisma.Decimal(dto.consultationFee) }
          : {}),
        ...(dto.currency !== undefined ? { defaultCurrency: dto.currency } : {}),
        ...(dto.timezone !== undefined ? { timezone: dto.timezone } : {}),
      },
      include: { owner: { select: { id: true, fullName: true } } },
    });
    return this.toPublic(chamber);
  }

  async setStatus(chamberId: string, status: ChamberStatus): Promise<PublicChamber> {
    const chamber = await this.prisma.chamber.update({
      where: { id: chamberId },
      data: { status },
      include: { owner: { select: { id: true, fullName: true } } },
    });
    return this.toPublic(chamber);
  }

  toPublic(chamber: ChamberWithOwner): PublicChamber {
    return {
      id: chamber.id,
      name: chamber.name,
      nameBangla: chamber.nameBangla,
      chamberCode: chamber.chamberCode,
      address: {
        line1: chamber.addressLine1,
        line2: chamber.addressLine2,
        area: chamber.area,
        city: chamber.city,
        district: chamber.district,
        division: chamber.division,
        postalCode: chamber.postalCode,
      },
      phone: chamber.phone,
      email: chamber.email,
      status: chamber.status,
      currency: chamber.defaultCurrency,
      timezone: chamber.timezone,
      consultationFee: chamber.consultationFee ? Number(chamber.consultationFee) : null,
      owner: { id: chamber.owner.id, fullName: chamber.owner.fullName },
      createdAt: chamber.createdAt,
      updatedAt: chamber.updatedAt,
    };
  }

  private async createWithRetry(doctorId: string, userId: string, dto: CreateChamberDto) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const chamberCode = this.generateChamberCode();
        return await this.prisma.transaction(async (tx) => {
          const chamber = await tx.chamber.create({
            data: {
              ownerDoctorId: doctorId,
              name: dto.name,
              nameBangla: dto.nameBangla,
              chamberCode,
              addressLine1: dto.address?.line1,
              addressLine2: dto.address?.line2,
              area: dto.address?.area,
              city: dto.address?.city,
              district: dto.address?.district,
              division: dto.address?.division,
              postalCode: dto.address?.postalCode,
              phone: dto.phone,
              email: dto.email,
              consultationFee:
                dto.consultationFee !== undefined
                  ? new Prisma.Decimal(dto.consultationFee)
                  : undefined,
              defaultCurrency: dto.currency,
              timezone: dto.timezone,
            },
          });
          await tx.chamberMembership.create({
            data: {
              chamberId: chamber.id,
              userId,
              role: UserRole.DOCTOR,
              status: MembershipStatus.ACTIVE,
              joinedAt: new Date(),
            },
          });
          return chamber;
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          continue;
        }
        throw error;
      }
    }
    throw new ConflictException({
      code: ErrorCode.ChamberCodeExists,
      message: 'Could not allocate a unique chamber code',
      details: [],
    });
  }

  private generateChamberCode(): string {
    let code = '';
    for (let i = 0; i < 8; i += 1) {
      code += CHAMBER_CODE_ALPHABET[randomInt(0, CHAMBER_CODE_ALPHABET.length)];
    }
    return `CH-${code}`;
  }
}
