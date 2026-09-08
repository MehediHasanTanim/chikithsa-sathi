import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, FileObject, FileStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';

import { ErrorCode } from '@common/constants/error-codes';
import { PrismaService } from '@database/prisma/prisma.service';
import { StorageService } from '@infrastructure/storage/storage.service';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { AuditService } from '@modules/auth/services/audit.service';
import { PermissionsService } from '@modules/permissions/permissions.service';
import type { CompleteUploadDto } from './dto/complete-upload.dto';
import type { CreateUploadUrlDto } from './dto/create-upload-url.dto';

export type PublicFile = {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  category: string;
  status: FileStatus;
  createdAt: Date;
  updatedAt: Date;
};

const ALLOWED_CONTENT_TYPES: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly permissions: PermissionsService,
    private readonly audit?: AuditService,
  ) {}

  async createUploadUrl(user: AuthenticatedUser, dto: CreateUploadUrlDto) {
    this.assertValidFile(dto);

    const storageKey = this.generateKey(user.id, dto.fileName);
    const file = await this.prisma.fileObject.create({
      data: {
        storageKey,
        originalName: dto.fileName,
        mimeType: dto.contentType,
        sizeBytes: BigInt(dto.sizeBytes),
        checksum: dto.checksumSha256,
        category: dto.category ?? 'DIAGNOSTIC_REPORT',
        uploadedById: user.id,
      },
    });

    const { url, expiresAt } = await this.storage.createUploadUrl(
      storageKey,
      dto.contentType,
      dto.sizeBytes,
      dto.checksumSha256,
    );
    await this.audit?.recordDomain(AuditAction.FILE_UPLOADED, user.id, 'FileObject', file.id, {
      category: file.category,
    });
    return { fileId: file.id, uploadUrl: url, expiresAt: expiresAt.toISOString() };
  }

  async complete(user: AuthenticatedUser, dto: CompleteUploadDto) {
    const file = await this.findFile(dto.fileId);
    this.assertOwner(file, user.id);

    if (file.status !== FileStatus.UPLOADING) {
      return { fileId: file.id, status: file.status };
    }

    const metadata = await this.storage.inspectUpload(file.storageKey);
    if (!metadata) {
      throw this.invalid('Uploaded object was not found in storage');
    }
    if (
      metadata.sizeBytes !== Number(file.sizeBytes) ||
      metadata.contentType !== file.mimeType ||
      !file.checksum ||
      metadata.checksumSha256 !== file.checksum
    ) {
      throw this.invalid('Uploaded object metadata does not match the requested upload');
    }
    if (metadata.scanStatus === 'INFECTED') {
      await this.prisma.fileObject.update({
        where: { id: file.id },
        data: { status: FileStatus.FAILED },
      });
      throw this.invalid('Uploaded object failed malware scanning');
    }
    if (metadata.scanStatus !== 'CLEAN') {
      return { fileId: file.id, status: FileStatus.UPLOADING };
    }

    await this.prisma.fileObject.update({
      where: { id: file.id },
      data: { status: FileStatus.AVAILABLE },
    });
    await this.audit?.recordDomain(AuditAction.FILE_AVAILABLE, user.id, 'FileObject', file.id);
    return { fileId: file.id, status: FileStatus.AVAILABLE };
  }

  async get(user: AuthenticatedUser, fileId: string) {
    const file = await this.findFile(fileId);
    if (file.uploadedById !== user.id) await this.assertAttachedResourceAccess(user, file.id);
    if (file.status !== FileStatus.AVAILABLE) {
      throw new BadRequestException({
        code: ErrorCode.FileNotAvailable,
        message: 'File is not available',
        details: [],
      });
    }

    const { url, expiresAt } = await this.storage.createDownloadUrl(file.storageKey);
    return { ...this.toPublic(file), downloadUrl: url, expiresAt: expiresAt.toISOString() };
  }

  async remove(user: AuthenticatedUser, fileId: string): Promise<{ message: string }> {
    const file = await this.findFile(fileId);
    this.assertOwner(file, user.id);
    await this.prisma.fileObject.update({
      where: { id: file.id },
      data: { status: FileStatus.DELETED, deletedAt: new Date() },
    });
    return { message: 'File deleted' };
  }

  private assertValidFile(dto: CreateUploadUrlDto): void {
    const allowedExtensions = ALLOWED_CONTENT_TYPES[dto.contentType];
    if (!allowedExtensions) {
      throw this.invalid('File content type is not supported');
    }
    const extension = this.extensionOf(dto.fileName);
    if (!extension || !allowedExtensions.includes(extension)) {
      throw this.invalid('File extension does not match its content type');
    }
  }

  private extensionOf(fileName: string): string | undefined {
    const index = fileName.lastIndexOf('.');
    return index >= 0 ? fileName.slice(index).toLowerCase() : undefined;
  }

  private generateKey(userId: string, fileName: string): string {
    const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `files/${userId}/${randomUUID()}-${sanitized}`;
  }

  private async findFile(fileId: string): Promise<FileObject> {
    const file = await this.prisma.fileObject.findUnique({ where: { id: fileId } });
    if (!file) {
      throw new NotFoundException({
        code: ErrorCode.FileNotFound,
        message: 'File was not found',
        details: [],
      });
    }
    return file;
  }

  private assertOwner(file: FileObject, userId: string): void {
    if (file.uploadedById !== userId) {
      throw new ForbiddenException({
        code: ErrorCode.FileForbidden,
        message: 'You do not have access to this file',
        details: [],
      });
    }
  }

  /**
   * Non-owners can only download a file through an attached resource that
   * they are authorized to read. An opaque UUID is never sufficient access.
   */
  private async assertAttachedResourceAccess(
    user: AuthenticatedUser,
    fileId: string,
  ): Promise<void> {
    const [reportLinks, receiptLinks] = await Promise.all([
      this.prisma.diagnosticReportFile.findMany({
        where: { fileId },
        select: { report: { select: { encounter: { select: { chamberId: true } } } } },
      }),
      this.prisma.receipt.findMany({
        where: { fileId },
        select: { payment: { select: { chamberId: true } } },
      }),
    ]);

    const resources = [
      ...reportLinks.map((link) => ({
        chamberId: link.report.encounter.chamberId,
        permission: 'encounters.read',
      })),
      ...receiptLinks.map((link) => ({
        chamberId: link.payment.chamberId,
        permission: 'payments.read',
      })),
    ];

    for (const resource of resources) {
      try {
        await this.permissions.requirePermissions(user.id, resource.chamberId, [
          resource.permission,
        ]);
        return;
      } catch (error) {
        if (!(error instanceof ForbiddenException)) throw error;
      }
    }

    throw new ForbiddenException({
      code: ErrorCode.FileForbidden,
      message: 'You do not have access to this file',
      details: [],
    });
  }

  private toPublic(file: FileObject): PublicFile {
    return {
      id: file.id,
      originalName: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: Number(file.sizeBytes),
      category: file.category,
      status: file.status,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    };
  }

  private invalid(message: string): BadRequestException {
    return new BadRequestException({ code: ErrorCode.FileInvalid, message, details: [] });
  }
}
