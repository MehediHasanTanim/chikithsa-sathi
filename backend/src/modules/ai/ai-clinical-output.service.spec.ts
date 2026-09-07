import { BadRequestException } from '@nestjs/common';

import { AIClinicalOutputService } from './ai-clinical-output.service';

describe('AIClinicalOutputService', () => {
  const service = new AIClinicalOutputService();

  it('parses a structured patient summary', () => {
    const summary = service.patientSummary(
      JSON.stringify({
        summary: 'Patient has a recent cough documented in the encounter.',
        activeProblems: ['Cough'],
        allergies: ['Penicillin'],
        recentFindings: ['Temperature was recorded.'],
        careConsiderations: ['Clinician should review vital trends.'],
        uncertainties: ['Duration was not documented.'],
      }),
    );

    expect(summary.summary).toContain('cough');
    expect(summary.activeProblems).toEqual(['Cough']);
  });

  it('rejects malformed or over-specified clinical JSON', () => {
    expect(() => service.patientSummary('{not-json')).toThrow(BadRequestException);
    expect(() =>
      service.prescriptionDraft(
        JSON.stringify({
          items: [{ medicineName: 'Example', medicineId: 'must-not-be-accepted' }],
        }),
      ),
    ).toThrow(BadRequestException);
  });

  it('parses a supported prescription draft without a medicine ID', () => {
    const draft = service.prescriptionDraft(
      JSON.stringify({
        clinicalSummary: 'Draft based on the supplied encounter.',
        advice: 'Clinician review is required.',
        items: [
          {
            itemType: 'MEDICINE',
            medicineName: 'Example medicine',
            dosage: '1 tablet',
            frequency: 'TWICE_DAILY',
            duration: 5,
            durationUnit: 'DAY',
          },
        ],
      }),
    );

    expect(draft.items).toHaveLength(1);
    expect(draft.items?.[0]).not.toHaveProperty('medicineId');
  });
});
