import { Injectable, NotFoundException } from '@nestjs/common';
import { Investigation, InvestigationStatus } from '@prisma/client';

import { ErrorCode } from '@common/constants/error-codes';
import { PrismaService } from '@database/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { ClinicalAccessService } from './clinical-access.service';
import type { CreateInvestigationDto } from './dto/create-investigation.dto';
import type { UpdateInvestigationDto } from './dto/update-investigation.dto';

@Injectable()
export class InvestigationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ClinicalAccessService,
  ) {}

  /** Distinct investigation names previously ordered in any chamber. */
  async catalog(user: AuthenticatedUser): Promise<Array<{ name: string }>> {
    await this.access.assertClinicalUser(user);
    return this.prisma.investigation.findMany({
      distinct: ['name'],
      select: { name: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(
    user: AuthenticatedUser,
    encounterId: string,
    dto: CreateInvestigationDto,
  ): Promise<Investigation> {
    await this.access.assertWrite(user, encounterId);
    return this.prisma.investigation.create({
      data: {
        encounterId,
        name: dto.name,
        nameBangla: dto.nameBangla,
        code: dto.code,
        instructions: dto.instructions,
        notes: dto.notes,
      },
    });
  }

  async list(user: AuthenticatedUser, encounterId: string): Promise<Investigation[]> {
    await this.access.assertRead(user, encounterId);
    return this.prisma.investigation.findMany({
      where: { encounterId },
      orderBy: { orderedAt: 'asc' },
    });
  }

  async update(
    user: AuthenticatedUser,
    investigationId: string,
    dto: UpdateInvestigationDto,
  ): Promise<Investigation> {
    const investigation = await this.findInvestigation(investigationId);
    await this.access.assertWrite(user, investigation.encounterId);

    return this.prisma.investigation.update({
      where: { id: investigationId },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.instructions !== undefined ? { instructions: dto.instructions } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.status === InvestigationStatus.COMPLETED ? { completedAt: new Date() } : {}),
      },
    });
  }

  private async findInvestigation(investigationId: string): Promise<Investigation> {
    const investigation = await this.prisma.investigation.findUnique({
      where: { id: investigationId },
    });
    if (!investigation) {
      throw new NotFoundException({
        code: ErrorCode.InvestigationNotFound,
        message: 'Investigation was not found',
        details: [],
      });
    }
    return investigation;
  }
}
