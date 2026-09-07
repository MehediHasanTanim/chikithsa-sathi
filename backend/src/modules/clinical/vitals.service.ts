import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Vital } from '@prisma/client';

import { ErrorCode } from '@common/constants/error-codes';
import { PrismaService } from '@database/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { ClinicalAccessService } from './clinical-access.service';
import type { CreateVitalDto } from './dto/create-vital.dto';
import type { UpdateVitalDto } from './dto/update-vital.dto';

export type PublicVital = {
  id: string;
  patientId: string;
  encounterId: string;
  temperature: number | null;
  systolicBP: number | null;
  diastolicBP: number | null;
  heartRate: number | null;
  respiratoryRate: number | null;
  oxygenSaturation: number | null;
  weightKg: number | null;
  heightCm: number | null;
  bmi: number | null;
  recordedById: string;
  recordedAt: Date;
};

@Injectable()
export class VitalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ClinicalAccessService,
  ) {}

  async create(
    user: AuthenticatedUser,
    encounterId: string,
    dto: CreateVitalDto,
  ): Promise<PublicVital> {
    const encounter = await this.access.assertWrite(user, encounterId);
    this.assertNotEmpty(dto);

    const vital = await this.prisma.vital.create({
      data: this.toCreateData(encounter.patientId, encounterId, user.id, dto),
    });
    return this.toPublic(vital);
  }

  async list(user: AuthenticatedUser, encounterId: string): Promise<PublicVital[]> {
    await this.access.assertRead(user, encounterId);
    const vitals = await this.prisma.vital.findMany({
      where: { encounterId },
      orderBy: { recordedAt: 'desc' },
    });
    return vitals.map((vital) => this.toPublic(vital));
  }

  async update(
    user: AuthenticatedUser,
    vitalId: string,
    dto: UpdateVitalDto,
  ): Promise<PublicVital> {
    const vital = await this.findVital(vitalId);
    await this.access.assertWrite(user, vital.encounterId);
    this.assertNotEmpty(dto);

    const updated = await this.prisma.vital.update({
      where: { id: vitalId },
      data: this.toUpdateData(vital, dto),
    });
    return this.toPublic(updated);
  }

  async listForPatient(user: AuthenticatedUser, patientId: string): Promise<PublicVital[]> {
    await this.access.assertPatientRead(user, patientId);
    const vitals = await this.prisma.vital.findMany({
      where: { patientId },
      orderBy: { recordedAt: 'desc' },
    });
    return vitals.map((vital) => this.toPublic(vital));
  }

  private toCreateData(
    patientId: string,
    encounterId: string,
    userId: string,
    dto: CreateVitalDto,
  ): Prisma.VitalUncheckedCreateInput {
    return {
      patientId,
      encounterId,
      recordedById: userId,
      temperature: this.decimal(dto.temperatureC),
      systolicBP: dto.systolicBp,
      diastolicBP: dto.diastolicBp,
      heartRate: dto.pulseBpm,
      respiratoryRate: dto.respiratoryRate,
      oxygenSaturation: this.decimal(dto.spo2),
      weightKg: this.decimal(dto.weightKg),
      heightCm: this.decimal(dto.heightCm),
      bmi: this.bmiFrom(dto.weightKg, dto.heightCm),
    };
  }

  private toUpdateData(vital: Vital, dto: UpdateVitalDto): Prisma.VitalUncheckedUpdateInput {
    const weightKg = dto.weightKg !== undefined ? this.decimal(dto.weightKg) : vital.weightKg;
    const heightCm = dto.heightCm !== undefined ? this.decimal(dto.heightCm) : vital.heightCm;
    const bmi =
      (dto.weightKg !== undefined || dto.heightCm !== undefined) && weightKg && heightCm
        ? this.bmiFrom(Number(weightKg), Number(heightCm))
        : undefined;

    return {
      ...(dto.temperatureC !== undefined ? { temperature: this.decimal(dto.temperatureC) } : {}),
      ...(dto.systolicBp !== undefined ? { systolicBP: dto.systolicBp } : {}),
      ...(dto.diastolicBp !== undefined ? { diastolicBP: dto.diastolicBp } : {}),
      ...(dto.pulseBpm !== undefined ? { heartRate: dto.pulseBpm } : {}),
      ...(dto.respiratoryRate !== undefined ? { respiratoryRate: dto.respiratoryRate } : {}),
      ...(dto.spo2 !== undefined ? { oxygenSaturation: this.decimal(dto.spo2) } : {}),
      ...(dto.weightKg !== undefined ? { weightKg } : {}),
      ...(dto.heightCm !== undefined ? { heightCm } : {}),
      ...(bmi ? { bmi } : {}),
    };
  }

  private decimal(value: number | undefined): Prisma.Decimal | undefined {
    return value !== undefined ? new Prisma.Decimal(value) : undefined;
  }

  private bmiFrom(
    weightKg: number | undefined,
    heightCm: number | undefined,
  ): Prisma.Decimal | undefined {
    if (weightKg === undefined || heightCm === undefined || heightCm === 0) return undefined;
    const bmi = weightKg / Math.pow(heightCm / 100, 2);
    return new Prisma.Decimal(bmi.toFixed(2));
  }

  private assertNotEmpty(dto: CreateVitalDto | UpdateVitalDto): void {
    const values = Object.values(dto);
    if (values.every((value) => value === undefined)) {
      throw new BadRequestException({
        code: ErrorCode.ClinicalInvalid,
        message: 'At least one vital measurement is required',
        details: [],
      });
    }
  }

  private async findVital(vitalId: string): Promise<Vital> {
    const vital = await this.prisma.vital.findUnique({ where: { id: vitalId } });
    if (!vital) {
      throw new NotFoundException({
        code: ErrorCode.VitalNotFound,
        message: 'Vital record was not found',
        details: [],
      });
    }
    return vital;
  }

  private toPublic(vital: Vital): PublicVital {
    return {
      id: vital.id,
      patientId: vital.patientId,
      encounterId: vital.encounterId,
      temperature: vital.temperature ? Number(vital.temperature) : null,
      systolicBP: vital.systolicBP,
      diastolicBP: vital.diastolicBP,
      heartRate: vital.heartRate,
      respiratoryRate: vital.respiratoryRate,
      oxygenSaturation: vital.oxygenSaturation ? Number(vital.oxygenSaturation) : null,
      weightKg: vital.weightKg ? Number(vital.weightKg) : null,
      heightCm: vital.heightCm ? Number(vital.heightCm) : null,
      bmi: vital.bmi ? Number(vital.bmi) : null,
      recordedById: vital.recordedById,
      recordedAt: vital.recordedAt,
    };
  }
}
