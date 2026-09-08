import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DoctorMedicineFavorite, Medicine, MembershipStatus, UserRole } from '@prisma/client';

import { ErrorCode } from '@common/constants/error-codes';
import { DatabaseRepository, Repository } from '@database/database.repository';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { DoctorsService } from '@modules/doctors/doctors.service';
import type { AddFavoriteDto } from './dto/add-favorite.dto';

type FavoriteWithMedicine = DoctorMedicineFavorite & { medicine: Medicine };

@Injectable()
export class MedicinesService {
  constructor(
    @Repository() private readonly repository: DatabaseRepository,
    private readonly doctors: DoctorsService,
  ) {}

  async search(user: AuthenticatedUser, q?: string): Promise<Medicine[]> {
    await this.assertClinicalUser(user);
    const where = q
      ? {
          isActive: true,
          OR: [
            { genericName: { contains: q, mode: 'insensitive' as const } },
            { genericNameBangla: { contains: q } },
            { brandName: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : { isActive: true };
    return this.repository.medicine.findMany({ where, orderBy: { genericName: 'asc' }, take: 50 });
  }

  async listFavorites(user: AuthenticatedUser): Promise<FavoriteWithMedicine[]> {
    await this.assertClinicalUser(user);
    const profile = await this.doctors.getOrCreateProfile(user.id);
    return this.repository.doctorMedicineFavorite.findMany({
      where: { doctorId: profile.id },
      include: { medicine: true },
      orderBy: { usageCount: 'desc' },
    });
  }

  async addFavorite(user: AuthenticatedUser, dto: AddFavoriteDto): Promise<FavoriteWithMedicine> {
    await this.assertClinicalUser(user);
    const profile = await this.doctors.getOrCreateProfile(user.id);
    const medicine = await this.repository.medicine.findUnique({ where: { id: dto.medicineId } });
    if (!medicine) throw this.notFound();

    return this.repository.doctorMedicineFavorite.upsert({
      where: { doctorId_medicineId: { doctorId: profile.id, medicineId: dto.medicineId } },
      create: { doctorId: profile.id, medicineId: dto.medicineId },
      update: {},
      include: { medicine: true },
    });
  }

  async removeFavorite(user: AuthenticatedUser, favoriteId: string): Promise<{ message: string }> {
    await this.assertClinicalUser(user);
    const profile = await this.doctors.getOrCreateProfile(user.id);
    const deleted = await this.repository.doctorMedicineFavorite.deleteMany({
      where: { id: favoriteId, doctorId: profile.id },
    });
    if (deleted.count === 0) throw this.notFound();
    return { message: 'Favorite removed' };
  }

  private async assertClinicalUser(user: AuthenticatedUser): Promise<void> {
    const membership = await this.repository.chamberMembership.findFirst({
      where: {
        userId: user.id,
        status: MembershipStatus.ACTIVE,
        role: { in: [UserRole.DOCTOR, UserRole.ASSISTANT_DOCTOR] },
      },
      select: { id: true },
    });
    if (!membership) {
      throw new ForbiddenException({
        code: ErrorCode.PermissionDenied,
        message: 'Clinical access is required',
        details: [],
      });
    }
  }

  private notFound(): NotFoundException {
    return new NotFoundException({
      code: ErrorCode.MedicineNotFound,
      message: 'Medicine was not found',
      details: [],
    });
  }
}
