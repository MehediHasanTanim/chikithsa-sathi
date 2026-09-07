import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import {
  FileCategory,
  FileStatus,
  ProfessionalVerification,
  VerificationStatus,
} from '@prisma/client';

import { ErrorCode } from '@common/constants/error-codes';
import { PrismaService } from '@database/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { DoctorsService } from '@modules/doctors/doctors.service';
import type { SubmitVerificationDto } from './dto/submit-verification.dto';

export type PublicVerification = {
  status: VerificationStatus;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  notes: string | null;
};

const BLOCKING_STATUSES: VerificationStatus[] = [
  VerificationStatus.SUBMITTED,
  VerificationStatus.UNDER_REVIEW,
  VerificationStatus.APPROVED,
];

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly doctors: DoctorsService,
  ) {}

  async status(user: AuthenticatedUser): Promise<PublicVerification> {
    const profile = await this.doctors.getOrCreateProfile(user.id);
    const verification = await this.getOrCreate(profile.id);
    return this.toPublic(verification);
  }

  async submit(
    user: AuthenticatedUser,
    dto: SubmitVerificationDto,
  ): Promise<{ status: VerificationStatus }> {
    const profile = await this.doctors.getOrCreateProfile(user.id);
    const verification = await this.getOrCreate(profile.id);

    if (BLOCKING_STATUSES.includes(verification.status)) {
      throw new ConflictException({
        code: ErrorCode.VerificationAlreadySubmitted,
        message: 'Verification has already been submitted',
        details: [],
      });
    }

    await this.assertOwnedVerificationFiles(
      user.id,
      dto.documents.map((document) => document.fileId),
    );

    await this.prisma.transaction(async (tx) => {
      if (dto.bmdcNumber) {
        await tx.doctorProfile.update({
          where: { id: profile.id },
          data: { bmdcNumber: dto.bmdcNumber },
        });
      }
      await tx.verificationDocument.deleteMany({ where: { verificationId: verification.id } });
      await tx.verificationDocument.createMany({
        data: dto.documents.map((document) => ({
          verificationId: verification.id,
          fileId: document.fileId,
          documentType: document.type,
          fileName: document.fileName,
        })),
      });
      await tx.professionalVerification.update({
        where: { id: verification.id },
        data: {
          status: VerificationStatus.SUBMITTED,
          submittedAt: new Date(),
          reviewedAt: null,
          reviewedById: null,
          rejectionReason: null,
        },
      });
    });

    return { status: VerificationStatus.SUBMITTED };
  }

  private async getOrCreate(doctorId: string): Promise<ProfessionalVerification> {
    const existing = await this.prisma.professionalVerification.findUnique({
      where: { doctorId },
    });
    if (existing) return existing;
    return this.prisma.professionalVerification.create({ data: { doctorId } });
  }

  private async assertOwnedVerificationFiles(userId: string, fileIds: string[]): Promise<void> {
    const uniqueFileIds = [...new Set(fileIds)];
    const files = await this.prisma.fileObject.findMany({
      where: {
        id: { in: uniqueFileIds },
        uploadedById: userId,
        category: FileCategory.VERIFICATION_DOCUMENT,
        status: FileStatus.AVAILABLE,
      },
      select: { id: true },
    });
    if (files.length !== uniqueFileIds.length) {
      throw new BadRequestException({
        code: ErrorCode.FileForbidden,
        message: 'Verification documents must be available files uploaded by you',
        details: [],
      });
    }
  }

  private toPublic(verification: ProfessionalVerification): PublicVerification {
    return {
      status: verification.status,
      submittedAt: verification.submittedAt,
      reviewedAt: verification.reviewedAt,
      rejectionReason: verification.rejectionReason,
      notes: verification.notes,
    };
  }
}
