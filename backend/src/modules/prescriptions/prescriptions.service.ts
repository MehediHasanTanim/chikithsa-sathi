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
import type { UpdatePrescriptionDto } from './dto/update-prescription.dto';

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
  version: number;
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
    if (prescription.status !== PrescriptionStatus.DRAFT) {
      throw this.invalid('Only draft prescriptions can be edited');
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

  private async createWithRetry(
    encounter: { id: string; patientId: string; chamberId: string; ownerDoctorId: string },
    dto: CreatePrescriptionDto,
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
      version: prescription.version,
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
