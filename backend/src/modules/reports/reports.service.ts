import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DiagnosticReport,
  DiagnosticReportFile,
  FileCategory,
  FileObject,
  FileStatus,
} from '@prisma/client';

import { ErrorCode } from '@common/constants/error-codes';
import { DatabaseRepository, Repository } from '@database/database.repository';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { PermissionsService } from '@modules/permissions/permissions.service';
import type { CreateReportDto } from './dto/create-report.dto';

type ReportWithFiles = DiagnosticReport & {
  files: Array<DiagnosticReportFile & { file: FileObject }>;
};

export type PublicReport = {
  id: string;
  patientId: string;
  encounterId: string;
  investigationId: string | null;
  title: string;
  reportDate: string | null;
  status: string;
  summary: string | null;
  findings: string | null;
  interpretation: string | null;
  aiSummary: string | null;
  aiAnalysis: string | null;
  createdAt: Date;
  updatedAt: Date;
  files: Array<{
    id: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
  }>;
};

@Injectable()
export class ReportsService {
  constructor(
    @Repository() private readonly repository: DatabaseRepository,
    private readonly permissions: PermissionsService,
  ) {}

  async create(
    user: AuthenticatedUser,
    encounterId: string,
    dto: CreateReportDto,
  ): Promise<PublicReport> {
    const encounter = await this.findEncounter(encounterId);
    await this.permissions.requirePermissions(user.id, encounter.chamberId, ['encounters.update']);

    if (dto.investigationId) {
      const investigation = await this.repository.investigation.findUnique({
        where: { id: dto.investigationId },
      });
      if (!investigation || investigation.encounterId !== encounterId) {
        throw this.invalid('Investigation does not belong to this encounter');
      }
    }

    if (dto.fileId) {
      const file = await this.repository.fileObject.findUnique({ where: { id: dto.fileId } });
      if (!file || file.status !== FileStatus.AVAILABLE) {
        throw this.invalid('File is not available');
      }
      if (file.uploadedById !== user.id) {
        throw new ForbiddenException({
          code: ErrorCode.FileForbidden,
          message: 'You can only attach files that you uploaded',
          details: [],
        });
      }
      if (file.category !== FileCategory.DIAGNOSTIC_REPORT) {
        throw this.invalid('Only diagnostic report files can be attached to a report');
      }
    }

    const report = await this.repository.diagnosticReport.create({
      data: {
        patientId: encounter.patientId,
        encounterId,
        investigationId: dto.investigationId,
        title: dto.title,
        reportDate: dto.reportDate ? new Date(dto.reportDate) : undefined,
        ...(dto.fileId ? { files: { create: { fileId: dto.fileId } } } : {}),
      },
      include: { files: { include: { file: true } } },
    });
    return this.toPublic(report);
  }

  async list(user: AuthenticatedUser, encounterId: string): Promise<PublicReport[]> {
    const encounter = await this.findEncounter(encounterId);
    await this.permissions.requirePermissions(user.id, encounter.chamberId, ['encounters.read']);
    const reports = await this.repository.diagnosticReport.findMany({
      where: { encounterId },
      include: { files: { include: { file: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return reports.map((report) => this.toPublic(report));
  }

  async get(user: AuthenticatedUser, reportId: string): Promise<PublicReport> {
    const report = await this.repository.diagnosticReport.findUnique({
      where: { id: reportId },
      include: { files: { include: { file: true } } },
    });
    if (!report) throw this.notFound();
    const encounter = await this.findEncounter(report.encounterId);
    await this.permissions.requirePermissions(user.id, encounter.chamberId, ['encounters.read']);
    return this.toPublic(report);
  }

  private async findEncounter(
    encounterId: string,
  ): Promise<{ id: string; patientId: string; chamberId: string }> {
    const encounter = await this.repository.encounter.findUnique({
      where: { id: encounterId },
      select: { id: true, patientId: true, chamberId: true },
    });
    if (!encounter) {
      throw new NotFoundException({
        code: ErrorCode.EncounterNotFound,
        message: 'Encounter was not found',
        details: [],
      });
    }
    return encounter;
  }

  private toPublic(report: ReportWithFiles): PublicReport {
    return {
      id: report.id,
      patientId: report.patientId,
      encounterId: report.encounterId,
      investigationId: report.investigationId,
      title: report.title,
      reportDate: report.reportDate ? report.reportDate.toISOString().slice(0, 10) : null,
      status: report.status,
      summary: report.summary,
      findings: report.findings,
      interpretation: report.interpretation,
      aiSummary: report.aiSummary,
      aiAnalysis: report.aiAnalysis,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      files: report.files.map((link) => ({
        id: link.file.id,
        originalName: link.file.originalName,
        mimeType: link.file.mimeType,
        sizeBytes: Number(link.file.sizeBytes),
      })),
    };
  }

  private invalid(message: string): BadRequestException {
    return new BadRequestException({ code: ErrorCode.FileInvalid, message, details: [] });
  }

  private notFound(): NotFoundException {
    return new NotFoundException({
      code: ErrorCode.ReportNotFound,
      message: 'Report was not found',
      details: [],
    });
  }
}
