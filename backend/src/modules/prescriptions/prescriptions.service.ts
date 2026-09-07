import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EncounterStatus,
  Medicine,
  Prisma,
  Prescription,
  PrescriptionItem,
  PrescriptionStatus,
} from '@prisma/client';
import { randomInt } from 'node:crypto';

import { ErrorCode } from '@common/constants/error-codes';
import { PrismaService } from '@database/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { PermissionsService } from '@modules/permissions/permissions.service';
import type { CreatePrescriptionDto, PrescriptionItemDto } from './dto/create-prescription.dto';
import type { AmendPrescriptionDto } from './dto/amend-prescription.dto';
import type { FinalizePrescriptionDto } from './dto/finalize-prescription.dto';
import type { ReviewPrescriptionDto } from './dto/review-prescription.dto';
import type { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { PrescriptionEventsService } from './prescription-events.service';

type PrescriptionWithItems = Prescription & {
  items: Array<PrescriptionItem & { medicine: Medicine | null }>;
};

export type PublicPrescription = {
  id: string;
  prescriptionNumber: string;
  chamberId: string;
  patientId: string;
  doctorId: string;
  encounterId: string;
  status: PrescriptionStatus;
  language: string;
  clinicalSummary: string | null;
  advice: string | null;
  followUpDate: string | null;
  aiGenerated: boolean;
  aiRequestId: string | null;
  version: number;
  reviewedAt: string | null;
  reviewedById: string | null;
  finalizedAt: string | null;
  finalizedById: string | null;
  deliveredAt: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: string;
    itemType: string;
    medicineId: string | null;
    medicineName: string | null;
    strength: string | null;
    dosageForm: string | null;
    dosage: string | null;
    frequency: string | null;
    frequencyText: string | null;
    duration: number | null;
    durationUnit: string | null;
    quantity: number | null;
    route: string | null;
    instructions: string | null;
    instructionsBangla: string | null;
    sortOrder: number;
  }>;
};

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

@Injectable()
export class PrescriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: PermissionsService,
    private readonly events: PrescriptionEventsService,
  ) {}

  async create(
    user: AuthenticatedUser,
    encounterId: string,
    dto: CreatePrescriptionDto,
  ): Promise<PublicPrescription> {
    const encounter = await this.findEncounter(encounterId);
    await this.permissions.requirePermissions(user.id, encounter.chamberId, [
      'prescriptions.create',
    ]);
    this.assertEditable(encounter.status);

    const prescription = await this.createWithRetry(encounter, dto);
    return this.toPublic(prescription);
  }

  async createAIAssisted(
    user: AuthenticatedUser,
    encounterId: string,
    dto: CreatePrescriptionDto,
    aiRequestId: string,
  ): Promise<PublicPrescription> {
    const encounter = await this.findEncounter(encounterId);
    await this.permissions.requirePermissions(user.id, encounter.chamberId, [
      'prescriptions.create',
    ]);
    this.assertEditable(encounter.status);

    const prescription = await this.createWithRetry(encounter, dto, {
      aiGenerated: true,
      status: PrescriptionStatus.AI_ASSISTED,
      aiRequestId,
    });
    return this.toPublic(prescription);
  }

  async get(user: AuthenticatedUser, prescriptionId: string): Promise<PublicPrescription> {
    const prescription = await this.findPrescription(prescriptionId);
    await this.permissions.requirePermissions(user.id, prescription.chamberId, ['encounters.read']);
    return this.toPublic(prescription);
  }

  async update(
    user: AuthenticatedUser,
    prescriptionId: string,
    dto: UpdatePrescriptionDto,
  ): Promise<PublicPrescription> {
    const prescription = await this.findPrescription(prescriptionId);
    await this.permissions.requirePermissions(user.id, prescription.chamberId, [
      'prescriptions.create',
    ]);
    if (
      prescription.status !== PrescriptionStatus.DRAFT &&
      prescription.status !== PrescriptionStatus.AI_ASSISTED
    ) {
      throw this.invalid('Only draft or AI-assisted prescriptions can be edited');
    }

    const updated = await this.prisma.prescription.update({
      where: { id: prescription.id },
      data: {
        ...(dto.language !== undefined ? { language: dto.language } : {}),
        ...(dto.clinicalSummary !== undefined ? { clinicalSummary: dto.clinicalSummary } : {}),
        ...(dto.advice !== undefined ? { advice: dto.advice } : {}),
        ...(dto.followUpDate !== undefined ? { followUpDate: new Date(dto.followUpDate) } : {}),
      },
      include: this.prescriptionInclude(),
    });
    return this.toPublic(updated);
  }

  async review(
    user: AuthenticatedUser,
    prescriptionId: string,
    dto: ReviewPrescriptionDto,
  ): Promise<PublicPrescription> {
    const prescription = await this.findPrescription(prescriptionId);
    await this.permissions.requirePermissions(user.id, prescription.chamberId, [
      'prescriptions.finalize',
    ]);
    if (dto.reviewed === false) {
      throw this.invalid('reviewed must be true to submit the prescription for review');
    }
    if (
      prescription.status !== PrescriptionStatus.DRAFT &&
      prescription.status !== PrescriptionStatus.AI_ASSISTED
    ) {
      throw this.invalid('Only draft or AI-assisted prescriptions can be submitted for review');
    }

    const updated = await this.prisma.prescription.update({
      where: { id: prescription.id },
      data: {
        status: PrescriptionStatus.REVIEW_REQUIRED,
        reviewedAt: new Date(),
        reviewedById: user.id,
      },
      include: this.prescriptionInclude(),
    });
    return this.toPublic(updated);
  }

  async finalize(
    user: AuthenticatedUser,
    prescriptionId: string,
    dto: FinalizePrescriptionDto,
  ): Promise<PublicPrescription> {
    if (!dto.confirmation) {
      throw this.invalid('Confirmation is required to finalize the prescription');
    }
    const prescription = await this.findPrescription(prescriptionId);
    await this.permissions.requirePermissions(user.id, prescription.chamberId, [
      'prescriptions.finalize',
    ]);
    if (
      prescription.status === PrescriptionStatus.FINALIZED ||
      prescription.status === PrescriptionStatus.DELIVERED
    ) {
      throw new ConflictException({
        code: ErrorCode.PrescriptionAlreadyFinalized,
        message: 'Prescription is already finalized',
        details: [],
      });
    }
    if (prescription.status !== PrescriptionStatus.REVIEW_REQUIRED) {
      throw new ConflictException({
        code: ErrorCode.PrescriptionReviewRequired,
        message: 'Prescription must be reviewed before finalization',
        details: [],
      });
    }
    if (prescription.items.length === 0) {
      throw this.invalid('Prescription must contain at least one item before finalization');
    }

    // Conditional update guards against concurrent finalization attempts.
    const result = await this.prisma.prescription.updateMany({
      where: { id: prescription.id, status: PrescriptionStatus.REVIEW_REQUIRED },
      data: {
        status: PrescriptionStatus.FINALIZED,
        finalizedAt: new Date(),
        finalizedById: user.id,
      },
    });
    if (result.count !== 1) {
      throw new ConflictException({
        code: ErrorCode.PrescriptionAlreadyFinalized,
        message: 'Prescription was finalized concurrently',
        details: [],
      });
    }

    const updated = await this.findPrescription(prescriptionId);
    this.events.finalized(prescriptionId);
    return this.toPublic(updated);
  }

  async deliver(user: AuthenticatedUser, prescriptionId: string): Promise<PublicPrescription> {
    const prescription = await this.findPrescription(prescriptionId);
    await this.permissions.requirePermissions(user.id, prescription.chamberId, [
      'prescriptions.finalize',
    ]);
    if (prescription.status !== PrescriptionStatus.FINALIZED) {
      throw this.invalid('Only finalized prescriptions can be delivered');
    }

    const updated = await this.prisma.prescription.update({
      where: { id: prescription.id },
      data: { status: PrescriptionStatus.DELIVERED, deliveredAt: new Date() },
      include: this.prescriptionInclude(),
    });
    this.events.delivered(prescriptionId);
    return this.toPublic(updated);
  }

  async amend(
    user: AuthenticatedUser,
    prescriptionId: string,
    dto: AmendPrescriptionDto,
  ): Promise<{
    amendmentId: string;
    prescriptionId: string;
    previousVersion: number;
    newVersion: number;
    reason: string;
  }> {
    const prescription = await this.findPrescription(prescriptionId);
    await this.permissions.requirePermissions(user.id, prescription.chamberId, [
      'prescriptions.finalize',
    ]);
    if (
      prescription.status !== PrescriptionStatus.FINALIZED &&
      prescription.status !== PrescriptionStatus.DELIVERED
    ) {
      throw this.invalid('Only finalized prescriptions can be amended');
    }

    const previousVersion = prescription.version;
    const newVersion = previousVersion + 1;
    const changes = JSON.parse(JSON.stringify({ items: dto.items ?? [] })) as Prisma.InputJsonValue;

    const amendment = await this.prisma.transaction(async (tx) => {
      const created = await tx.prescriptionAmendment.create({
        data: {
          prescriptionId: prescription.id,
          amendedById: user.id,
          previousVersion,
          newVersion,
          reason: dto.reason,
          changes,
        },
      });
      await tx.prescription.update({
        where: { id: prescription.id },
        data: { version: newVersion },
      });
      return created;
    });

    this.events.amended(prescriptionId);
    return {
      amendmentId: amendment.id,
      prescriptionId: prescription.id,
      previousVersion,
      newVersion,
      reason: amendment.reason,
    };
  }

  async history(
    user: AuthenticatedUser,
    prescriptionId: string,
  ): Promise<{
    id: string;
    prescriptionNumber: string;
    currentVersion: number;
    amendments: Array<{
      id: string;
      amendedById: string;
      previousVersion: number;
      newVersion: number;
      reason: string;
      changes: Prisma.JsonValue;
      createdAt: Date;
    }>;
  }> {
    const prescription = await this.findPrescription(prescriptionId);
    await this.permissions.requirePermissions(user.id, prescription.chamberId, ['encounters.read']);
    const amendments = await this.prisma.prescriptionAmendment.findMany({
      where: { prescriptionId: prescription.id },
      orderBy: { createdAt: 'asc' as const },
    });

    return {
      id: prescription.id,
      prescriptionNumber: prescription.prescriptionNumber,
      currentVersion: prescription.version,
      amendments: amendments.map((amendment) => ({
        id: amendment.id,
        amendedById: amendment.amendedById,
        previousVersion: amendment.previousVersion,
        newVersion: amendment.newVersion,
        reason: amendment.reason,
        changes: amendment.changes,
        createdAt: amendment.createdAt,
      })),
    };
  }

  async pdf(
    user: AuthenticatedUser,
    prescriptionId: string,
  ): Promise<{
    status: string;
    prescriptionId: string;
  }> {
    const prescription = await this.findPrescription(prescriptionId);
    await this.permissions.requirePermissions(user.id, prescription.chamberId, ['encounters.read']);
    if (
      prescription.status !== PrescriptionStatus.FINALIZED &&
      prescription.status !== PrescriptionStatus.DELIVERED
    ) {
      throw this.invalid('A PDF is only available for finalized prescriptions');
    }

    this.events.pdfRequested(prescriptionId);
    return { status: 'PROCESSING', prescriptionId: prescription.id };
  }

  private async createWithRetry(
    encounter: { id: string; patientId: string; chamberId: string; ownerDoctorId: string },
    dto: CreatePrescriptionDto,
    options?: { aiGenerated?: boolean; status?: PrescriptionStatus; aiRequestId?: string },
  ): Promise<PrescriptionWithItems> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const prescriptionNumber = this.generateNumber();
        return await this.prisma.prescription.create({
          data: {
            prescriptionNumber,
            chamberId: encounter.chamberId,
            patientId: encounter.patientId,
            doctorId: encounter.ownerDoctorId,
            encounterId: encounter.id,
            ...(options?.status ? { status: options.status } : {}),
            ...(options?.aiGenerated ? { aiGenerated: true } : {}),
            ...(options?.aiRequestId ? { aiRequestId: options.aiRequestId } : {}),
            language: dto.language,
            clinicalSummary: dto.clinicalSummary,
            advice: dto.advice,
            followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : undefined,
            items: dto.items?.length
              ? { create: dto.items.map((item, index) => this.toItemData(item, index)) }
              : undefined,
          },
          include: this.prescriptionInclude(),
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          continue;
        }
        throw error;
      }
    }
    throw new ConflictException({
      code: ErrorCode.PrescriptionCodeExists,
      message: 'Could not allocate a unique prescription number',
      details: [],
    });
  }

  private toItemData(
    item: PrescriptionItemDto,
    sortOrder: number,
  ): Prisma.PrescriptionItemUncheckedCreateWithoutPrescriptionInput {
    return {
      medicineId: item.medicineId,
      itemType: item.itemType,
      medicineName: item.medicineName,
      strength: item.strength,
      dosageForm: item.dosageForm,
      dosage: item.dosage,
      frequency: item.frequency,
      frequencyText: item.frequencyText,
      duration: item.duration,
      durationUnit: item.durationUnit,
      quantity: item.quantity !== undefined ? new Prisma.Decimal(item.quantity) : undefined,
      route: item.route,
      instructions: item.instructions,
      instructionsBangla: item.instructionsBangla,
      sortOrder,
    };
  }

  private async findEncounter(encounterId: string): Promise<{
    id: string;
    patientId: string;
    chamberId: string;
    ownerDoctorId: string;
    status: EncounterStatus;
  }> {
    const encounter = await this.prisma.encounter.findUnique({
      where: { id: encounterId },
      select: {
        id: true,
        patientId: true,
        chamberId: true,
        status: true,
        chamber: { select: { ownerDoctorId: true } },
      },
    });
    if (!encounter) {
      throw new NotFoundException({
        code: ErrorCode.EncounterNotFound,
        message: 'Encounter was not found',
        details: [],
      });
    }
    return {
      id: encounter.id,
      patientId: encounter.patientId,
      chamberId: encounter.chamberId,
      ownerDoctorId: encounter.chamber.ownerDoctorId,
      status: encounter.status,
    };
  }

  private async findPrescription(prescriptionId: string): Promise<PrescriptionWithItems> {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: this.prescriptionInclude(),
    });
    if (!prescription) {
      throw new NotFoundException({
        code: ErrorCode.PrescriptionNotFound,
        message: 'Prescription was not found',
        details: [],
      });
    }
    return prescription;
  }

  private assertEditable(status: EncounterStatus): void {
    if (status === EncounterStatus.COMPLETED || status === EncounterStatus.LOCKED) {
      throw this.invalid('A prescription cannot be created for a completed or locked encounter');
    }
  }

  private prescriptionInclude() {
    return { items: { include: { medicine: true }, orderBy: { sortOrder: 'asc' as const } } };
  }

  private generateNumber(): string {
    let code = '';
    for (let i = 0; i < 8; i += 1) {
      code += CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length)];
    }
    return `PR-${code}`;
  }

  private toPublic(prescription: PrescriptionWithItems): PublicPrescription {
    return {
      id: prescription.id,
      prescriptionNumber: prescription.prescriptionNumber,
      chamberId: prescription.chamberId,
      patientId: prescription.patientId,
      doctorId: prescription.doctorId,
      encounterId: prescription.encounterId,
      status: prescription.status,
      language: prescription.language,
      clinicalSummary: prescription.clinicalSummary,
      advice: prescription.advice,
      followUpDate: prescription.followUpDate
        ? prescription.followUpDate.toISOString().slice(0, 10)
        : null,
      aiGenerated: prescription.aiGenerated,
      aiRequestId: prescription.aiRequestId,
      version: prescription.version,
      reviewedAt: prescription.reviewedAt ? prescription.reviewedAt.toISOString() : null,
      reviewedById: prescription.reviewedById,
      finalizedAt: prescription.finalizedAt ? prescription.finalizedAt.toISOString() : null,
      finalizedById: prescription.finalizedById,
      deliveredAt: prescription.deliveredAt ? prescription.deliveredAt.toISOString() : null,
      createdAt: prescription.createdAt,
      updatedAt: prescription.updatedAt,
      items: prescription.items.map((item) => ({
        id: item.id,
        itemType: item.itemType,
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        strength: item.strength,
        dosageForm: item.dosageForm,
        dosage: item.dosage,
        frequency: item.frequency,
        frequencyText: item.frequencyText,
        duration: item.duration,
        durationUnit: item.durationUnit,
        quantity: item.quantity ? Number(item.quantity) : null,
        route: item.route,
        instructions: item.instructions,
        instructionsBangla: item.instructionsBangla,
        sortOrder: item.sortOrder,
      })),
    };
  }

  private invalid(message: string): BadRequestException {
    return new BadRequestException({ code: ErrorCode.PrescriptionInvalid, message, details: [] });
  }
}
