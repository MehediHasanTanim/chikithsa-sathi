import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseRepository, Repository } from '@database/database.repository';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { PermissionsService } from '@modules/permissions/permissions.service';
import { CreatePrescriptionTemplateDto, UpdatePrescriptionTemplateDto } from './dto/prescription-template.dto';
import { PrescriptionsService } from './prescriptions.service';

@Injectable()
export class PrescriptionTemplatesService {
  constructor(@Repository() private readonly repository: DatabaseRepository, private readonly permissions: PermissionsService, private readonly prescriptions: PrescriptionsService) {}

  async create(user: AuthenticatedUser, dto: CreatePrescriptionTemplateDto) {
    await this.permissions.requirePermissions(user.id, dto.chamberId, ['prescriptions.create']);
    const doctor = await this.repository.doctorProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
    if (!doctor) throw new NotFoundException('A doctor profile is required to own a prescription template');
    return this.repository.prescriptionTemplate.create({ data: { doctorId: doctor.id, chamberId: dto.chamberId, name: dto.name, clinicalSummary: dto.clinicalSummary, advice: dto.advice, followUpDays: dto.followUpDays, items: dto.items?.length ? { create: dto.items.map((item, sortOrder) => ({ ...item, sortOrder })) } : undefined }, include: { items: { orderBy: { sortOrder: 'asc' } } } });
  }

  async list(user: AuthenticatedUser, chamberId: string) {
    await this.permissions.requirePermissions(user.id, chamberId, ['prescriptions.create']);
    return this.repository.prescriptionTemplate.findMany({ where: { chamberId, doctor: { userId: user.id }, isActive: true }, include: { items: { orderBy: { sortOrder: 'asc' } } }, orderBy: { name: 'asc' } });
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdatePrescriptionTemplateDto) {
    const template = await this.owned(user.id, id);
    await this.permissions.requirePermissions(user.id, template.chamberId!, ['prescriptions.create']);
    return this.repository.prescriptionTemplate.update({ where: { id }, data: { name: dto.name, clinicalSummary: dto.clinicalSummary, advice: dto.advice, followUpDays: dto.followUpDays, isActive: dto.isActive, ...(dto.items ? { items: { deleteMany: {}, create: dto.items.map((item, sortOrder) => ({ ...item, sortOrder })) } } : {}) }, include: { items: { orderBy: { sortOrder: 'asc' } } } });
  }

  async remove(user: AuthenticatedUser, id: string) {
    const template = await this.owned(user.id, id);
    await this.permissions.requirePermissions(user.id, template.chamberId!, ['prescriptions.create']);
    await this.repository.prescriptionTemplate.delete({ where: { id } });
    return { deleted: true };
  }

  async apply(user: AuthenticatedUser, id: string, encounterId: string) {
    const template = await this.repository.prescriptionTemplate.findFirst({ where: { id, doctor: { userId: user.id }, isActive: true }, include: { items: { orderBy: { sortOrder: 'asc' } } } });
    if (!template) throw new NotFoundException('Prescription template was not found');
    const encounter = await this.repository.encounter.findUnique({ where: { id: encounterId }, select: { chamberId: true } });
    if (!encounter || encounter.chamberId !== template.chamberId) throw new NotFoundException('Encounter was not found in the template chamber');
    return this.prescriptions.create(user, encounterId, {
      language: 'bn', clinicalSummary: template.clinicalSummary ?? undefined, advice: template.advice ?? undefined,
      ...(template.followUpDays ? { followUpDate: new Date(Date.now() + template.followUpDays * 86_400_000).toISOString().slice(0, 10) } : {}),
      items: template.items.map((item) => ({ medicineId: item.medicineId ?? undefined, itemType: item.itemType, medicineName: item.medicineName ?? undefined, strength: item.strength ?? undefined, dosageForm: item.dosageForm ?? undefined, dosage: item.dosage ?? undefined, frequency: item.frequency ?? undefined, frequencyText: item.frequencyText ?? undefined, duration: item.durationDays ?? undefined, instructions: item.instruction ?? undefined })),
    });
  }

  private async owned(userId: string, id: string) {
    const template = await this.repository.prescriptionTemplate.findFirst({ where: { id, doctor: { userId } } });
    if (!template) throw new NotFoundException('Prescription template was not found');
    return template;
  }
}
