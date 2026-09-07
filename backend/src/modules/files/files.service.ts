import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FileObject, FileStatus, MembershipStatus, UserRole } from '@prisma/client';
import { randomUUID } from 'node:crypto';

import { ErrorCode } from '@common/constants/error-codes';
import { PrismaService } from '@database/prisma/prisma.service';
import { StorageService } from '@infrastructure/storage/storage.service';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
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
        category: dto.category ?? 'DIAGNOSTIC_REPORT',
        uploadedById: user.id,
      },
    });

    const { url, expiresAt } = await this.storage.createUploadUrl(
      storageKey,
      dto.contentType,
      dto.sizeBytes,
    );
    return { fileId: file.id, uploadUrl: url, expiresAt: expiresAt.toISOString() };
  }

  async complete(user: AuthenticatedUser, dto: CompleteUploadDto) {
    const file = await this.findFile(dto.fileId);
    this.assertOwner(file, user.id);

    if (file.status === FileStatus.UPLOADING) {
      await this.prisma.fileObject.update({
        where: { id: file.id },
        data: { status: FileStatus.AVAILABLE },
      });
    }
    return { fileId: file.id, status: FileStatus.AVAILABLE };
  }

  async get(user: AuthenticatedUser, fileId: string) {
    const file = await this.findFile(fileId);
    if (file.uploadedById !== user.id) await this.assertClinicalUser(user);
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

  private async assertClinicalUser(user: AuthenticatedUser): Promise<void> {
    const membership = await this.prisma.chamberMembership.findFirst({
      where: {
        userId: user.id,
        status: MembershipStatus.ACTIVE,
        role: { in: [UserRole.DOCTOR, UserRole.ASSISTANT_DOCTOR] },
      },
      select: { id: true },
    });
    if (!membership) {
      throw new ForbiddenException({
        code: ErrorCode.FileForbidden,
        message: 'You do not have access to this file',
        details: [],
      });
    }
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
