import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type DoctorProfile } from '@prisma/client';

import { ErrorCode } from '@common/constants/error-codes';
import { PrismaService } from '@database/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import type { UpdateDoctorDto } from './dto/update-doctor.dto';
import type { UpdateProfessionalProfileDto } from './dto/update-professional-profile.dto';

export type PublicDoctorProfile = {
  id: string;
  userId: string;
  fullName: string;
  nameBangla: string | null;
  designation: string | null;
  specialization: string | null;
  subSpecialization: string | null;
  qualifications: string[];
  medicalCollege: string | null;
  bmdcNumber: string | null;
  registrationAuthority: string | null;
  yearsOfExperience: number | null;
  consultationFee: number | null;
  bio: string | null;
  bioBangla: string | null;
  profileImageFileId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class DoctorsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateProfile(userId: string): Promise<DoctorProfile> {
    const existing = await this.prisma.doctorProfile.findUnique({ where: { userId } });
    if (existing) return existing;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true },
    });
    if (!user) throw this.notFound();

    return this.prisma.doctorProfile.create({
      data: { userId, fullName: user.fullName },
    });
  }

  async getProfile(user: AuthenticatedUser): Promise<PublicDoctorProfile> {
    return this.toPublic(await this.getOrCreateProfile(user.id));
  }

  async updateProfile(user: AuthenticatedUser, dto: UpdateDoctorDto): Promise<PublicDoctorProfile> {
    const profile = await this.getOrCreateProfile(user.id);
    const updated = await this.prisma.doctorProfile.update({
      where: { id: profile.id },
      data: {
        ...(dto.fullName !== undefined ? { fullName: dto.fullName } : {}),
        ...(dto.nameBangla !== undefined ? { nameBangla: dto.nameBangla } : {}),
        ...(dto.designation !== undefined ? { designation: dto.designation } : {}),
        ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
        ...(dto.bioBangla !== undefined ? { bioBangla: dto.bioBangla } : {}),
      },
    });
    return this.toPublic(updated);
  }

  async updateProfessionalProfile(
    user: AuthenticatedUser,
    dto: UpdateProfessionalProfileDto,
  ): Promise<PublicDoctorProfile> {
    const profile = await this.getOrCreateProfile(user.id);
    const updated = await this.prisma.doctorProfile.update({
      where: { id: profile.id },
      data: {
        ...(dto.specialization !== undefined ? { specialization: dto.specialization } : {}),
        ...(dto.subSpecialization !== undefined
          ? { subSpecialization: dto.subSpecialization }
          : {}),
        ...(dto.qualifications !== undefined ? { qualifications: dto.qualifications } : {}),
        ...(dto.medicalCollege !== undefined ? { medicalCollege: dto.medicalCollege } : {}),
        ...(dto.bmdcNumber !== undefined ? { bmdcNumber: dto.bmdcNumber } : {}),
        ...(dto.registrationAuthority !== undefined
          ? { registrationAuthority: dto.registrationAuthority }
          : {}),
        ...(dto.yearsOfExperience !== undefined
          ? { yearsOfExperience: dto.yearsOfExperience }
          : {}),
        ...(dto.consultationFee !== undefined
          ? { consultationFee: new Prisma.Decimal(dto.consultationFee) }
          : {}),
      },
    });
    return this.toPublic(updated);
  }

  private toPublic(profile: DoctorProfile): PublicDoctorProfile {
    return {
      id: profile.id,
      userId: profile.userId,
      fullName: profile.fullName,
      nameBangla: profile.nameBangla,
      designation: profile.designation,
      specialization: profile.specialization,
      subSpecialization: profile.subSpecialization,
      qualifications: Array.isArray(profile.qualifications)
        ? (profile.qualifications as string[])
        : [],
      medicalCollege: profile.medicalCollege,
      bmdcNumber: profile.bmdcNumber,
      registrationAuthority: profile.registrationAuthority,
      yearsOfExperience: profile.yearsOfExperience,
      consultationFee: profile.consultationFee ? Number(profile.consultationFee) : null,
      bio: profile.bio,
      bioBangla: profile.bioBangla,
      profileImageFileId: profile.profileImageFileId,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  private notFound(): NotFoundException {
    return new NotFoundException({
      code: ErrorCode.DoctorNotFound,
      message: 'Doctor profile was not found',
      details: [],
    });
  }
}
