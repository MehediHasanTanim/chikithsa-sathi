import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, MembershipStatus, Patient, Prisma } from '@prisma/client';
import { randomInt } from 'node:crypto';

import { ErrorCode } from '@common/constants/error-codes';
import { offsetPaginationMeta, toOffsetPagination } from '@common/utils/pagination.util';
import { DatabaseRepository, Repository } from '@database/database.repository';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { AuditService } from '@modules/auth/services/audit.service';
import { PermissionsService } from '@modules/permissions/permissions.service';
import type { AssociateChamberDto } from './dto/associate-chamber.dto';
import type { CreatePatientAllergyDto } from './dto/create-patient-allergy.dto';
import type { CreatePatientConditionDto } from './dto/create-patient-condition.dto';
import type { CreatePatientDto } from './dto/create-patient.dto';
import type { PatientQueryDto } from './dto/patient-query.dto';
import type { SearchPatientDto } from './dto/search-patient.dto';
import type { UpdatePatientDto } from './dto/update-patient.dto';

export type PublicPatient = {
  id: string;
  patientCode: string;
  firstName: string;
  lastName: string | null;
  fullName: string;
  nameBangla: string | null;
  phone: string | null;
  alternatePhone: string | null;
  email: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  bloodGroup: string | null;
  nationalId: string | null;
  address: {
    line1: string | null;
    line2: string | null;
    area: string | null;
    city: string | null;
    district: string | null;
    division: string | null;
    postalCode: string | null;
  };
  emergencyName: string | null;
  emergencyPhone: string | null;
  emergencyRelation: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const PATIENT_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

@Injectable()
export class PatientsService {
  constructor(
    @Repository() private readonly repository: DatabaseRepository,
    private readonly permissions: PermissionsService,
    private readonly audit?: AuditService,
  ) {}

  async create(user: AuthenticatedUser, dto: CreatePatientDto): Promise<PublicPatient> {
    await this.permissions.requirePermissions(user.id, dto.chamberId, ['patients.create']);
    await this.assertNotDuplicate(dto);

    const { firstName, lastName } = this.deriveName(dto.fullName);
    const patient = await this.createWithRetry(dto, firstName, lastName, user.id);
    await this.audit?.recordDomain(AuditAction.PATIENT_CREATED, user.id, 'Patient', patient.id, {
      chamberId: dto.chamberId,
    });
    return this.toPublic(patient);
  }

  async list(
    user: AuthenticatedUser,
    query: PatientQueryDto,
  ): Promise<{ items: PublicPatient[]; pagination: ReturnType<typeof offsetPaginationMeta> }> {
    await this.permissions.requirePermissions(user.id, query.chamberId, ['patients.read']);

    const { page, limit, skip, take } = toOffsetPagination(query.page, query.limit);
    const where: Prisma.PatientWhereInput = {
      chambers: { some: { chamberId: query.chamberId } },
      ...(query.search ? this.searchWhere(query.search) : {}),
      ...(query.gender ? { gender: query.gender } : {}),
    };

    const [patients, total] = await Promise.all([
      this.repository.patient.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.repository.patient.count({ where }),
    ]);

    return {
      items: patients.map((patient) => this.toPublic(patient)),
      pagination: offsetPaginationMeta(page, limit, total),
    };
  }

  async search(
    user: AuthenticatedUser,
    dto: SearchPatientDto,
  ): Promise<{ items: PublicPatient[]; pagination: ReturnType<typeof offsetPaginationMeta> }> {
    const accessible = await this.accessibleChamberIds(user.id);
    if (dto.chamberId && !accessible.includes(dto.chamberId)) throw this.forbidden();
    const chamberIds = dto.chamberId ? [dto.chamberId] : accessible;
    if (chamberIds.length === 0) {
      return { items: [], pagination: offsetPaginationMeta(dto.page ?? 1, dto.limit ?? 25, 0) };
    }

    const { page, limit, skip, take } = toOffsetPagination(dto.page, dto.limit);
    const where: Prisma.PatientWhereInput = {
      chambers: { some: { chamberId: { in: chamberIds } } },
      ...this.searchWhere(dto.q),
    };

    const [patients, total] = await Promise.all([
      this.repository.patient.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.repository.patient.count({ where }),
    ]);

    return {
      items: patients.map((patient) => this.toPublic(patient)),
      pagination: offsetPaginationMeta(page, limit, total),
    };
  }

  async getById(user: AuthenticatedUser, patientId: string): Promise<PublicPatient> {
    const patient = await this.findPatient(patientId);
    await this.assertPatientAccess(user.id, patientId, 'patients.read');
    return this.toPublic(patient);
  }

  async update(
    user: AuthenticatedUser,
    patientId: string,
    dto: UpdatePatientDto,
  ): Promise<PublicPatient> {
    await this.findPatient(patientId);
    await this.assertPatientAccess(user.id, patientId, 'patients.update');

    const updated = await this.repository.patient.update({
      where: { id: patientId },
      data: {
        ...(dto.fullName !== undefined
          ? {
              fullName: dto.fullName,
              ...this.deriveName(dto.fullName),
            }
          : {}),
        ...(dto.nameBangla !== undefined ? { nameBangla: dto.nameBangla } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.alternatePhone !== undefined ? { alternatePhone: dto.alternatePhone } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.dateOfBirth !== undefined ? { dateOfBirth: new Date(dto.dateOfBirth) } : {}),
        ...(dto.gender !== undefined ? { gender: dto.gender } : {}),
        ...(dto.bloodGroup !== undefined ? { bloodGroup: dto.bloodGroup } : {}),
        ...(dto.nationalId !== undefined ? { nationalId: dto.nationalId } : {}),
        ...(dto.address?.line1 !== undefined ? { addressLine1: dto.address.line1 } : {}),
        ...(dto.address?.line2 !== undefined ? { addressLine2: dto.address.line2 } : {}),
        ...(dto.address?.area !== undefined ? { area: dto.address.area } : {}),
        ...(dto.address?.city !== undefined ? { city: dto.address.city } : {}),
        ...(dto.address?.district !== undefined ? { district: dto.address.district } : {}),
        ...(dto.address?.division !== undefined ? { division: dto.address.division } : {}),
        ...(dto.address?.postalCode !== undefined ? { postalCode: dto.address.postalCode } : {}),
        ...(dto.emergencyName !== undefined ? { emergencyName: dto.emergencyName } : {}),
        ...(dto.emergencyPhone !== undefined ? { emergencyPhone: dto.emergencyPhone } : {}),
        ...(dto.emergencyRelation !== undefined
          ? { emergencyRelation: dto.emergencyRelation }
          : {}),
      },
    });
    await this.audit?.recordDomain(AuditAction.PATIENT_UPDATED, user.id, 'Patient', updated.id);
    return this.toPublic(updated);
  }

  async associateChamber(
    user: AuthenticatedUser,
    patientId: string,
    dto: AssociateChamberDto,
  ): Promise<PublicPatient> {
    const patient = await this.findPatient(patientId);
    await this.assertPatientAccess(user.id, patientId, 'patients.update');
    await this.permissions.requirePermissions(user.id, dto.chamberId, ['patients.update']);

    await this.repository.patientChamber.upsert({
      where: { patientId_chamberId: { patientId, chamberId: dto.chamberId } },
      create: { patientId, chamberId: dto.chamberId, notes: dto.notes },
      update: { notes: dto.notes },
    });
    return this.toPublic(patient);
  }

  async listAllergies(user: AuthenticatedUser, patientId: string) {
    await this.assertPatientAccess(user.id, patientId, 'patients.read');
    return this.repository.patientAllergy.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addAllergy(user: AuthenticatedUser, patientId: string, dto: CreatePatientAllergyDto) {
    await this.assertPatientAccess(user.id, patientId, 'patients.update');
    return this.repository.patientAllergy.create({
      data: {
        patientId,
        allergen: dto.allergen,
        reaction: dto.reaction,
        severity: dto.severity,
        notes: dto.notes,
      },
    });
  }

  async removeAllergy(user: AuthenticatedUser, patientId: string, allergyId: string) {
    await this.assertPatientAccess(user.id, patientId, 'patients.update');
    const deleted = await this.repository.patientAllergy.deleteMany({
      where: { id: allergyId, patientId },
    });
    if (deleted.count === 0) {
      throw this.notFound(ErrorCode.NotFound, 'Allergy was not found');
    }
    return { message: 'Allergy removed' };
  }

  async listConditions(user: AuthenticatedUser, patientId: string) {
    await this.assertPatientAccess(user.id, patientId, 'patients.read');
    return this.repository.patientCondition.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addCondition(user: AuthenticatedUser, patientId: string, dto: CreatePatientConditionDto) {
    await this.assertPatientAccess(user.id, patientId, 'patients.update');
    return this.repository.patientCondition.create({
      data: {
        patientId,
        condition: dto.condition,
        diagnosedAt: dto.diagnosedAt ? new Date(dto.diagnosedAt) : undefined,
        status: dto.status,
        notes: dto.notes,
      },
    });
  }

  private async assertNotDuplicate(dto: CreatePatientDto): Promise<void> {
    if (!dto.phone || !dto.dateOfBirth) return;
    const duplicate = await this.repository.patient.findFirst({
      where: {
        phone: dto.phone,
        fullName: dto.fullName,
        dateOfBirth: new Date(dto.dateOfBirth),
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new ConflictException({
        code: ErrorCode.PatientDuplicate,
        message: 'A patient with the same phone, name, and date of birth already exists',
        details: [{ patientId: duplicate.id }],
      });
    }
  }

  private async createWithRetry(
    dto: CreatePatientDto,
    firstName: string,
    lastName: string | null,
    userId: string,
  ): Promise<Patient> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const patientCode = this.generatePatientCode();
        return await this.repository.transaction(async (tx) => {
          const patient = await tx.patient.create({
            data: {
              patientCode,
              firstName,
              lastName,
              fullName: dto.fullName,
              nameBangla: dto.nameBangla,
              phone: dto.phone,
              alternatePhone: dto.alternatePhone,
              email: dto.email,
              dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
              gender: dto.gender,
              bloodGroup: dto.bloodGroup,
              nationalId: dto.nationalId,
              addressLine1: dto.address?.line1,
              addressLine2: dto.address?.line2,
              area: dto.address?.area,
              city: dto.address?.city,
              district: dto.address?.district,
              division: dto.address?.division,
              postalCode: dto.address?.postalCode,
              emergencyName: dto.emergencyName,
              emergencyPhone: dto.emergencyPhone,
              emergencyRelation: dto.emergencyRelation,
              createdById: userId,
            },
          });
          await tx.patientChamber.create({
            data: { patientId: patient.id, chamberId: dto.chamberId },
          });
          return patient;
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          continue;
        }
        throw error;
      }
    }
    throw new ConflictException({
      code: ErrorCode.PatientCodeExists,
      message: 'Could not allocate a unique patient code',
      details: [],
    });
  }

  private async findPatient(patientId: string): Promise<Patient> {
    const patient = await this.repository.patient.findUnique({ where: { id: patientId } });
    if (!patient) throw this.notFound(ErrorCode.PatientNotFound, 'Patient was not found');
    return patient;
  }

  private async assertPatientAccess(
    userId: string,
    patientId: string,
    permission: string,
  ): Promise<void> {
    const links = await this.repository.patientChamber.findMany({
      where: { patientId },
      select: { chamberId: true },
    });
    const accessible = new Set(await this.accessibleChamberIds(userId));
    const link = links.find((l) => accessible.has(l.chamberId));
    if (!link) throw this.forbidden();
    await this.permissions.requirePermissions(userId, link.chamberId, [permission]);
  }

  private async accessibleChamberIds(userId: string): Promise<string[]> {
    const memberships = await this.repository.chamberMembership.findMany({
      where: { userId, status: MembershipStatus.ACTIVE },
      select: { chamberId: true },
    });
    return memberships.map((membership) => membership.chamberId);
  }

  private searchWhere(term: string): Prisma.PatientWhereInput {
    return {
      OR: [
        { fullName: { contains: term, mode: 'insensitive' } },
        { nameBangla: { contains: term } },
        { patientCode: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term } },
      ],
    };
  }

  private deriveName(fullName: string): { firstName: string; lastName: string | null } {
    const parts = fullName.trim().split(/\s+/);
    const firstName = parts[0] ?? fullName;
    const lastName = parts.slice(1).join(' ') || null;
    return { firstName, lastName };
  }

  private generatePatientCode(): string {
    let code = '';
    for (let i = 0; i < 8; i += 1) {
      code += PATIENT_CODE_ALPHABET[randomInt(0, PATIENT_CODE_ALPHABET.length)];
    }
    return `P-${code}`;
  }

  private toPublic(patient: Patient): PublicPatient {
    return {
      id: patient.id,
      patientCode: patient.patientCode,
      firstName: patient.firstName,
      lastName: patient.lastName,
      fullName: patient.fullName,
      nameBangla: patient.nameBangla,
      phone: patient.phone,
      alternatePhone: patient.alternatePhone,
      email: patient.email,
      dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.toISOString().slice(0, 10) : null,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
      nationalId: patient.nationalId,
      address: {
        line1: patient.addressLine1,
        line2: patient.addressLine2,
        area: patient.area,
        city: patient.city,
        district: patient.district,
        division: patient.division,
        postalCode: patient.postalCode,
      },
      emergencyName: patient.emergencyName,
      emergencyPhone: patient.emergencyPhone,
      emergencyRelation: patient.emergencyRelation,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
    };
  }

  private forbidden(): ForbiddenException {
    return new ForbiddenException({
      code: ErrorCode.PatientForbidden,
      message: 'You do not have access to this patient',
      details: [],
    });
  }

  private notFound(code: string, message: string): NotFoundException {
    return new NotFoundException({ code, message, details: [] });
  }
}
