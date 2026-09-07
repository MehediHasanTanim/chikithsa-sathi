import { Injectable, NotFoundException } from '@nestjs/common';

import { ErrorCode } from '@common/constants/error-codes';
import { PrismaService } from '@database/prisma/prisma.service';

export type AIContextInput = {
  chamberId: string;
  patientId?: string;
  encounterId?: string;
};

export type AIContext = {
  text: string;
  metadata: { patientIncluded: boolean; encounterIncluded: boolean; encounterCount: number };
  patientId?: string;
  encounterId?: string;
};

@Injectable()
export class AIContextBuilderService {
  constructor(private readonly prisma: PrismaService) {}

  async build(input: AIContextInput): Promise<AIContext> {
    let patientId = input.patientId;
    const encounterId = input.encounterId;
    const sections: string[] = [];
    let encounterCount = 0;

    if (patientId) {
      const link = await this.prisma.patientChamber.findUnique({
        where: { patientId_chamberId: { patientId, chamberId: input.chamberId } },
        select: { patientId: true },
      });
      if (!link) {
        throw new NotFoundException({
          code: ErrorCode.PatientNotFound,
          message: 'Patient is not linked to this chamber',
          details: [],
        });
      }
      const patient = await this.prisma.patient.findUnique({
        where: { id: patientId },
        select: {
          dateOfBirth: true,
          gender: true,
          bloodGroup: true,
          allergies: true,
          conditions: true,
        },
      });
      if (!patient) {
        throw new NotFoundException({
          code: ErrorCode.PatientNotFound,
          message: 'Patient was not found',
          details: [],
        });
      }
      sections.push(
        JSON.stringify({
          patient: {
            age: this.ageInYears(patient.dateOfBirth),
            gender: patient.gender,
            bloodGroup: patient.bloodGroup,
            allergies: patient.allergies.map((allergy) => ({
              allergen: allergy.allergen,
              reaction: allergy.reaction,
              severity: allergy.severity,
            })),
            conditions: patient.conditions.map((condition) => ({
              condition: condition.condition,
              status: condition.status,
            })),
          },
        }),
      );
    }

    if (encounterId) {
      const encounter = await this.prisma.encounter.findUnique({
        where: { id: encounterId },
        include: {
          notes: { orderBy: { createdAt: 'desc' }, take: 10 },
          vitals: { orderBy: { recordedAt: 'desc' }, take: 10 },
          diagnoses: { include: { diagnosis: true } },
          investigations: { orderBy: { orderedAt: 'desc' }, take: 20 },
        },
      });
      if (
        !encounter ||
        encounter.chamberId !== input.chamberId ||
        (patientId !== undefined && encounter.patientId !== patientId)
      ) {
        throw new NotFoundException({
          code: ErrorCode.EncounterNotFound,
          message: 'Encounter was not found',
          details: [],
        });
      }
      patientId ??= encounter.patientId;
      encounterCount = 1;
      sections.push(
        JSON.stringify({
          encounter: {
            status: encounter.status,
            chiefComplaint: encounter.chiefComplaint,
            notes: encounter.notes.map((note) => ({ type: note.type, content: note.content })),
            vitals: encounter.vitals.map((vital) => ({
              temperature: vital.temperature,
              systolicBP: vital.systolicBP,
              diastolicBP: vital.diastolicBP,
              heartRate: vital.heartRate,
              oxygenSaturation: vital.oxygenSaturation,
              weightKg: vital.weightKg,
              heightCm: vital.heightCm,
            })),
            diagnoses: encounter.diagnoses.map((entry) => ({
              name: entry.diagnosis.name,
              type: entry.type,
            })),
            investigations: encounter.investigations.map((investigation) => ({
              name: investigation.name,
              status: investigation.status,
            })),
          },
        }),
      );
    }

    return {
      text:
        sections.length > 0
          ? sections.join('\n')
          : 'No patient or encounter context was requested.',
      metadata: {
        patientIncluded: patientId !== undefined,
        encounterIncluded: encounterId !== undefined,
        encounterCount,
      },
      ...(patientId ? { patientId } : {}),
      ...(encounterId ? { encounterId } : {}),
    };
  }

  private ageInYears(dateOfBirth: Date | null): number | null {
    if (!dateOfBirth) return null;
    const now = new Date();
    let age = now.getUTCFullYear() - dateOfBirth.getUTCFullYear();
    const monthDifference = now.getUTCMonth() - dateOfBirth.getUTCMonth();
    if (
      monthDifference < 0 ||
      (monthDifference === 0 && now.getUTCDate() < dateOfBirth.getUTCDate())
    ) {
      age -= 1;
    }
    return age;
  }
}
