import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseRepository, Repository } from '@database/database.repository';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { PermissionsService } from '@modules/permissions/permissions.service';

@Injectable()
export class ClinicalHistoryService {
  constructor(@Repository() private readonly repository: DatabaseRepository, private readonly permissions: PermissionsService) {}

  async medicationHistory(user: AuthenticatedUser, patientId: string, chamberId: string) {
    await this.assertLinked(user, patientId, chamberId);
    return this.repository.prescription.findMany({ where: { patientId, chamberId }, orderBy: { createdAt: 'desc' }, select: { id: true, prescriptionNumber: true, status: true, createdAt: true, items: { select: { medicineName: true, strength: true, dosage: true, frequencyText: true } } } });
  }

  async timeline(user: AuthenticatedUser, patientId: string, chamberId: string) {
    await this.assertLinked(user, patientId, chamberId);
    const [encounters, prescriptions, vitals] = await Promise.all([
      this.repository.encounter.findMany({ where: { patientId, chamberId }, select: { id: true, encounterDate: true, status: true }, orderBy: { encounterDate: 'desc' } }),
      this.repository.prescription.findMany({ where: { patientId, chamberId }, select: { id: true, prescriptionNumber: true, createdAt: true, status: true }, orderBy: { createdAt: 'desc' } }),
      this.repository.vital.findMany({ where: { encounter: { patientId, chamberId } }, select: { id: true, recordedAt: true, temperature: true, systolicBP: true, diastolicBP: true, heartRate: true, respiratoryRate: true, oxygenSaturation: true, weightKg: true, heightCm: true, bmi: true }, orderBy: { recordedAt: 'desc' } }),
    ]);
    return [...encounters.map((x) => ({ type: 'ENCOUNTER', occurredAt: x.encounterDate, data: x })), ...prescriptions.map((x) => ({ type: 'PRESCRIPTION', occurredAt: x.createdAt, data: x })), ...vitals.map((x) => ({ type: 'VITAL', occurredAt: x.recordedAt, data: x }))].sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
  }

  private async assertLinked(user: AuthenticatedUser, patientId: string, chamberId: string) {
    await this.permissions.requirePermissions(user.id, chamberId, ['encounters.read']);
    const link = await this.repository.patientChamber.findUnique({ where: { patientId_chamberId: { patientId, chamberId } }, select: { patientId: true } });
    if (!link) throw new NotFoundException('Patient is not linked to this chamber');
  }
}
