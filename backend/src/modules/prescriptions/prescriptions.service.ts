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
  FileCategory,
  FileStatus,
} from '@prisma/client';
import { randomInt } from 'node:crypto';
import { createHash, randomUUID } from 'node:crypto';

import { ErrorCode } from '@common/constants/error-codes';
import { DatabaseRepository, Repository } from '@database/database.repository';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { PermissionsService } from '@modules/permissions/permissions.service';
import type { CreatePrescriptionDto, PrescriptionItemDto } from './dto/create-prescription.dto';
import type { AmendPrescriptionDto } from './dto/amend-prescription.dto';
import type { FinalizePrescriptionDto } from './dto/finalize-prescription.dto';
import type { ReviewPrescriptionDto } from './dto/review-prescription.dto';
import type { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { PrescriptionEventsService } from './prescription-events.service';
import { StorageService } from '@infrastructure/storage/storage.service';
import { AppointmentsService } from '@modules/appointments/appointments.service';
import type { CreateFollowUpDto } from './dto/create-follow-up.dto';

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
    @Repository() private readonly repository: DatabaseRepository,
    private readonly permissions: PermissionsService,
    private readonly events: PrescriptionEventsService,
    private readonly storage: StorageService,
    private readonly appointments: AppointmentsService,
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

    const updated = await this.repository.prescription.update({
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

    const updated = await this.repository.prescription.update({
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
    const result = await this.repository.prescription.updateMany({
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

    const updated = await this.repository.prescription.update({
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

    const amendment = await this.repository.transaction(async (tx) => {
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
    const amendments = await this.repository.prescriptionAmendment.findMany({
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
  ): Promise<{ status: string; prescriptionId: string; fileId: string; downloadUrl: string; expiresAt: string }> {
    const prescription = await this.findPrescription(prescriptionId);
    await this.permissions.requirePermissions(user.id, prescription.chamberId, ['encounters.read']);
    if (
      prescription.status !== PrescriptionStatus.FINALIZED &&
      prescription.status !== PrescriptionStatus.DELIVERED
    ) {
      throw this.invalid('A PDF is only available for finalized prescriptions');
    }

    if (prescription.pdfFileId) {
      const file = await this.repository.fileObject.findUnique({ where: { id: prescription.pdfFileId } });
      if (file?.status === FileStatus.AVAILABLE) {
        const signed = await this.storage.createDownloadUrl(file.storageKey);
        return { status: 'READY', prescriptionId, fileId: file.id, downloadUrl: signed.url, expiresAt: signed.expiresAt.toISOString() };
      }
    }
    const document = this.renderPdf(prescription);
    const key = `prescriptions/${prescription.chamberId}/${prescription.id}/${randomUUID()}.pdf`;
    await this.storage.putGeneratedObject(key, 'application/pdf', document);
    const file = await this.repository.transaction(async (tx) => {
      const created = await tx.fileObject.create({ data: { storageKey: key, originalName: `${prescription.prescriptionNumber}.pdf`, mimeType: 'application/pdf', sizeBytes: BigInt(document.byteLength), checksum: createHash('sha256').update(document).digest('hex'), category: FileCategory.PRESCRIPTION_ATTACHMENT, status: FileStatus.AVAILABLE } });
      await tx.prescription.update({ where: { id: prescription.id }, data: { pdfFileId: created.id } });
      return created;
    });
    this.events.pdfRequested(prescriptionId);
    const signed = await this.storage.createDownloadUrl(key);
    return { status: 'READY', prescriptionId, fileId: file.id, downloadUrl: signed.url, expiresAt: signed.expiresAt.toISOString() };
  }

  async createFollowUp(user: AuthenticatedUser, prescriptionId: string, dto: CreateFollowUpDto) {
    const prescription = await this.findPrescription(prescriptionId);
    await this.permissions.requirePermissions(user.id, prescription.chamberId, ['appointments.create']);
    return this.appointments.create(user, { chamberId: prescription.chamberId, patientId: prescription.patientId, scheduledAt: dto.scheduledAt, type: 'FOLLOW_UP', reason: `Follow-up for ${prescription.prescriptionNumber}` });
  }

  private renderPdf(prescription: PrescriptionWithItems): Buffer {
    const escape = (value: string) => value.replace(/[\\()]/g, '\\$&').replace(/[\r\n]+/g, ' ');
    const lines = [
      `Prescription ${prescription.prescriptionNumber}`,
      `Date: ${prescription.createdAt.toISOString().slice(0, 10)}`,
      ...(prescription.clinicalSummary ? [`Summary: ${prescription.clinicalSummary}`] : []),
      ...prescription.items.map((item) => `${item.medicineName ?? 'Medicine'} ${item.strength ?? ''} ${item.dosage ?? ''} ${item.frequencyText ?? item.frequency ?? ''}`.trim()),
      ...(prescription.advice ? [`Advice: ${prescription.advice}`] : []),
    ].slice(0, 40);
    const content = ['BT', '/F1 11 Tf', '50 780 Td', ...lines.flatMap((line, index) => [`(${escape(line)}) Tj`, ...(index < lines.length - 1 ? ['0 -18 Td'] : [])]), 'ET'].join('\n');
    const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>', `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
    let pdf = '%PDF-1.4\n'; const offsets = [0];
    objects.forEach((object, i) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${i + 1} 0 obj\n${object}\nendobj\n`; });
    const xref = Buffer.byteLength(pdf); pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${offset.toString().padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return Buffer.from(pdf, 'utf8');
  }

  private async createWithRetry(
    encounter: { id: string; patientId: string; chamberId: string; ownerDoctorId: string },
    dto: CreatePrescriptionDto,
    options?: { aiGenerated?: boolean; status?: PrescriptionStatus; aiRequestId?: string },
  ): Promise<PrescriptionWithItems> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const prescriptionNumber = this.generateNumber();
        return await this.repository.prescription.create({
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
    const encounter = await this.repository.encounter.findUnique({
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
    const prescription = await this.repository.prescription.findUnique({
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
