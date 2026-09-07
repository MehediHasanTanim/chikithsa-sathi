import { ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { PrescriptionStatus } from '@prisma/client';

import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { AIClinicalFeaturesService } from './ai-clinical-features.service';
import { AIClinicalOutputService } from './ai-clinical-output.service';

const user = { id: 'user-1' } as AuthenticatedUser;

const provenanceResult = {
  requestId: 'request-1',
  draftId: 'draft-1',
  content: '',
  model: 'gpt-4o-mini',
  reviewRequired: true as const,
  disclaimer: 'Clinician review required',
  usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
};

const summaryContent = JSON.stringify({
  summary: 'A factual clinical summary.',
  activeProblems: ['Cough'],
  allergies: [],
  recentFindings: [],
  careConsiderations: ['Review by clinician.'],
  uncertainties: [],
});

const prescriptionContent = JSON.stringify({
  clinicalSummary: 'Proposed clinical summary.',
  advice: 'Review before use.',
  items: [{ itemType: 'MEDICINE', medicineName: 'Example medicine' }],
});

describe('AIClinicalFeaturesService', () => {
  const orchestrator = { generate: jest.fn() };
  const prescriptions = { createAIAssisted: jest.fn() };
  const permissions = { requirePermissions: jest.fn() };
  const service = new AIClinicalFeaturesService(
    orchestrator as never,
    new AIClinicalOutputService(),
    prescriptions as never,
    permissions as never,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    permissions.requirePermissions.mockResolvedValue(undefined);
  });

  it('returns a structured patient summary with provenance', async () => {
    orchestrator.generate.mockResolvedValue({ ...provenanceResult, content: summaryContent });

    const result = await service.patientSummary(user, {
      chamberId: 'chamber-1',
      patientId: 'patient-1',
    });

    expect(orchestrator.generate).toHaveBeenCalledWith(
      user,
      expect.objectContaining({ feature: 'PATIENT_SUMMARY' }),
      expect.anything(),
    );
    expect(result.summary.activeProblems).toEqual(['Cough']);
    expect(result.provenance).toMatchObject({ requestId: 'request-1', reviewRequired: true });
  });

  it('passes bounded conversation context to clinical chat', async () => {
    orchestrator.generate.mockResolvedValue({
      ...provenanceResult,
      content: 'Clinician review is needed.',
    });

    const result = await service.clinicalChat(user, {
      chamberId: 'chamber-1',
      patientId: 'patient-1',
      question: 'What should I review?',
      conversation: [{ role: 'user', content: 'The symptom began yesterday.' }],
    });

    expect(result.answer).toBe('Clinician review is needed.');
    expect(orchestrator.generate).toHaveBeenCalledWith(
      user,
      expect.objectContaining({ feature: 'CLINICAL_CHAT' }),
      expect.objectContaining({
        additionalMessages: [{ role: 'user', content: 'The symptom began yesterday.' }],
      }),
    );
  });

  it('creates only an AI-assisted prescription draft that still requires review', async () => {
    orchestrator.generate.mockResolvedValue({ ...provenanceResult, content: prescriptionContent });
    prescriptions.createAIAssisted.mockResolvedValue({
      id: 'prescription-1',
      status: PrescriptionStatus.AI_ASSISTED,
      aiGenerated: true,
      aiRequestId: 'request-1',
    });

    const result = await service.prescriptionDraft(user, {
      chamberId: 'chamber-1',
      patientId: 'patient-1',
      encounterId: 'encounter-1',
      language: 'en',
    });

    expect(prescriptions.createAIAssisted).toHaveBeenCalledTimes(1);
    expect(result.prescription.status).toBe(PrescriptionStatus.AI_ASSISTED);
    expect(result.provenance.reviewRequired).toBe(true);
  });

  it('does not fall back to a prescription write when AI generation fails', async () => {
    orchestrator.generate.mockRejectedValue(new ServiceUnavailableException());

    await expect(
      service.prescriptionDraft(user, {
        chamberId: 'chamber-1',
        patientId: 'patient-1',
        encounterId: 'encounter-1',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(prescriptions.createAIAssisted).not.toHaveBeenCalled();
  });

  it('does not send patient context to AI when prescription permission is denied', async () => {
    permissions.requirePermissions.mockRejectedValue(new ForbiddenException());

    await expect(
      service.prescriptionDraft(user, {
        chamberId: 'chamber-1',
        patientId: 'patient-1',
        encounterId: 'encounter-1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(orchestrator.generate).not.toHaveBeenCalled();
    expect(prescriptions.createAIAssisted).not.toHaveBeenCalled();
  });

  it('does not create a prescription when structured AI output is malformed', async () => {
    orchestrator.generate.mockResolvedValue({ ...provenanceResult, content: '{invalid-json' });

    await expect(
      service.prescriptionDraft(user, {
        chamberId: 'chamber-1',
        patientId: 'patient-1',
        encounterId: 'encounter-1',
      }),
    ).rejects.toThrow('malformed clinical response');
    expect(prescriptions.createAIAssisted).not.toHaveBeenCalled();
  });
});
