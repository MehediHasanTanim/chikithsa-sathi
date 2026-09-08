import { Injectable, NotFoundException } from '@nestjs/common';
import { Diagnosis, EncounterDiagnosis } from '@prisma/client';

import { ErrorCode } from '@common/constants/error-codes';
import { DatabaseRepository, Repository } from '@database/database.repository';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { ClinicalAccessService } from './clinical-access.service';
import type { AssignDiagnosisDto } from './dto/assign-diagnosis.dto';

type EncounterDiagnosisWithDiagnosis = EncounterDiagnosis & { diagnosis: Diagnosis };

@Injectable()
export class DiagnosesService {
  constructor(
    @Repository() private readonly repository: DatabaseRepository,
    private readonly access: ClinicalAccessService,
  ) {}

  async search(user: AuthenticatedUser, q?: string): Promise<Diagnosis[]> {
    await this.access.assertClinicalUser(user);
    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { nameBangla: { contains: q } },
            { code: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {};
    return this.repository.diagnosis.findMany({ where, orderBy: { name: 'asc' }, take: 50 });
  }

  async list(
    user: AuthenticatedUser,
    encounterId: string,
  ): Promise<EncounterDiagnosisWithDiagnosis[]> {
    await this.access.assertRead(user, encounterId);
    return this.repository.encounterDiagnosis.findMany({
      where: { encounterId },
      include: { diagnosis: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async assign(
    user: AuthenticatedUser,
    encounterId: string,
    dto: AssignDiagnosisDto,
  ): Promise<EncounterDiagnosisWithDiagnosis> {
    await this.access.assertWrite(user, encounterId);
    const diagnosis = await this.repository.diagnosis.findUnique({
      where: { id: dto.diagnosisId },
    });
    if (!diagnosis) {
      throw new NotFoundException({
        code: ErrorCode.DiagnosisNotFound,
        message: 'Diagnosis was not found',
        details: [],
      });
    }
    return this.repository.encounterDiagnosis.create({
      data: {
        encounterId,
        diagnosisId: dto.diagnosisId,
        type: dto.type,
        notes: dto.notes,
      },
      include: { diagnosis: true },
    });
  }

  async remove(
    user: AuthenticatedUser,
    encounterId: string,
    encounterDiagnosisId: string,
  ): Promise<{ message: string }> {
    await this.access.assertWrite(user, encounterId);
    const deleted = await this.repository.encounterDiagnosis.deleteMany({
      where: { id: encounterDiagnosisId, encounterId },
    });
    if (deleted.count === 0) {
      throw new NotFoundException({
        code: ErrorCode.DiagnosisNotFound,
        message: 'Encounter diagnosis was not found',
        details: [],
      });
    }
    return { message: 'Diagnosis removed' };
  }
}
