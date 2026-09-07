import { BadRequestException, Injectable } from '@nestjs/common';
import { DurationUnit, MedicineFrequency, PrescriptionItemType } from '@prisma/client';
import { z } from 'zod';

import { ErrorCode } from '@common/constants/error-codes';
import type { CreatePrescriptionDto } from '@modules/prescriptions/dto/create-prescription.dto';

const shortText = z.string().trim().min(1).max(2000);
const summarySchema = z
  .object({
    summary: shortText.max(5000),
    activeProblems: z.array(shortText.max(500)).max(20),
    allergies: z.array(shortText.max(500)).max(20),
    recentFindings: z.array(shortText.max(1000)).max(30),
    careConsiderations: z.array(shortText.max(1000)).max(20),
    uncertainties: z.array(shortText.max(1000)).max(20),
  })
  .strict();

const prescriptionItemSchema = z
  .object({
    itemType: z.nativeEnum(PrescriptionItemType).optional(),
    medicineName: z.string().trim().min(1).max(255).optional(),
    strength: z.string().trim().min(1).max(100).optional(),
    dosageForm: z.string().trim().min(1).max(100).optional(),
    dosage: z.string().trim().min(1).max(100).optional(),
    frequency: z.nativeEnum(MedicineFrequency).optional(),
    frequencyText: z.string().trim().min(1).max(255).optional(),
    duration: z.number().int().min(1).max(365).optional(),
    durationUnit: z.nativeEnum(DurationUnit).optional(),
    quantity: z.number().nonnegative().max(10000).optional(),
    route: z.string().trim().min(1).max(100).optional(),
    instructions: z.string().trim().min(1).max(2000).optional(),
    instructionsBangla: z.string().trim().min(1).max(2000).optional(),
  })
  .strict()
  .refine(
    (item) => Boolean(item.medicineName || item.instructions || item.instructionsBangla),
    'Each prescription item requires a medicine name or instruction',
  );

const prescriptionSchema = z
  .object({
    clinicalSummary: z.string().trim().min(1).max(5000).optional(),
    advice: z.string().trim().min(1).max(5000).optional(),
    followUpDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    items: z.array(prescriptionItemSchema).max(20),
  })
  .strict();

export type PatientSummary = z.infer<typeof summarySchema>;

@Injectable()
export class AIClinicalOutputService {
  patientSummary(content: string): PatientSummary {
    return this.parse(summarySchema, content);
  }

  prescriptionDraft(content: string): CreatePrescriptionDto {
    return this.parse(prescriptionSchema, content);
  }

  private parse<T>(schema: z.ZodType<T>, content: string): T {
    try {
      return schema.parse(JSON.parse(this.jsonContent(content)));
    } catch {
      throw new BadRequestException({
        code: ErrorCode.AIInvalidResponse,
        message: 'AI provider returned a malformed clinical response',
        details: [],
      });
    }
  }

  private jsonContent(content: string): string {
    const trimmed = content.trim();
    if (trimmed.startsWith('```') && trimmed.endsWith('```')) {
      return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    }
    return trimmed;
  }
}
