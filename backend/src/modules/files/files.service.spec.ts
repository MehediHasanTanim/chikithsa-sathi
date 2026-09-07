import { BadRequestException, ForbiddenException } from '@nestjs/common';

import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { FilesService } from './files.service';

const user = { id: 'user-1' } as AuthenticatedUser;

describe('FilesService', () => {
  const prisma = {
    fileObject: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    diagnosticReportFile: { findMany: jest.fn() },
    receipt: { findMany: jest.fn() },
  };
  const storage = {
    createUploadUrl: jest.fn(),
    createDownloadUrl: jest.fn(),
    inspectUpload: jest.fn(),
  };
  const permissions = { requirePermissions: jest.fn() };
  const service = new FilesService(prisma as never, storage as never, permissions as never);

  beforeEach(() => jest.resetAllMocks());

  it('creates a file and returns a pre-signed upload URL', async () => {
    storage.createUploadUrl.mockResolvedValue({
      url: 'https://signed.example',
      expiresAt: new Date(),
    });
    prisma.fileObject.create.mockResolvedValue({
      id: 'file-1',
      storageKey: 'files/user-1/uuid-cbc.pdf',
      originalName: 'cbc.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1000n,
      checksum: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      category: 'DIAGNOSTIC_REPORT',
      status: 'UPLOADING',
      uploadedById: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.createUploadUrl(user, {
      fileName: 'cbc.pdf',
      contentType: 'application/pdf',
      sizeBytes: 1000,
      checksumSha256: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    });

    expect(prisma.fileObject.create).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ fileId: 'file-1', uploadUrl: 'https://signed.example' });
  });

  it('rejects an unsupported content type', async () => {
    await expect(
      service.createUploadUrl(user, {
        fileName: 'virus.exe',
        contentType: 'application/x-msdownload',
        sizeBytes: 100,
        checksumSha256: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a file whose extension does not match its content type', async () => {
    await expect(
      service.createUploadUrl(user, {
        fileName: 'notes.txt',
        contentType: 'application/pdf',
        sizeBytes: 100,
        checksumSha256: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('allows the uploader to download their available file', async () => {
    const file = {
      id: 'file-1',
      storageKey: 'files/user-1/uuid-cbc.pdf',
      originalName: 'cbc.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1000n,
      checksum: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      category: 'DIAGNOSTIC_REPORT',
      status: 'AVAILABLE',
      uploadedById: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prisma.fileObject.findUnique.mockResolvedValue(file);
    storage.createDownloadUrl.mockResolvedValue({
      url: 'https://download.example',
      expiresAt: new Date(),
    });

    await expect(service.get(user, 'file-1')).resolves.toMatchObject({
      id: 'file-1',
      downloadUrl: 'https://download.example',
    });
    expect(permissions.requirePermissions).not.toHaveBeenCalled();
  });

  it('allows a user with access to the attached report chamber to download a file', async () => {
    prisma.fileObject.findUnique.mockResolvedValue({
      id: 'file-1',
      storageKey: 'files/user-2/uuid-cbc.pdf',
      originalName: 'cbc.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1000n,
      checksum: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      category: 'DIAGNOSTIC_REPORT',
      status: 'AVAILABLE',
      uploadedById: 'user-2',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prisma.diagnosticReportFile.findMany.mockResolvedValue([
      { report: { encounter: { chamberId: 'chamber-1' } } },
    ]);
    prisma.receipt.findMany.mockResolvedValue([]);
    permissions.requirePermissions.mockResolvedValue(undefined);
    storage.createDownloadUrl.mockResolvedValue({
      url: 'https://download.example',
      expiresAt: new Date(),
    });

    await expect(service.get(user, 'file-1')).resolves.toMatchObject({ id: 'file-1' });
    expect(permissions.requirePermissions).toHaveBeenCalledWith('user-1', 'chamber-1', [
      'encounters.read',
    ]);
  });

  it('rejects a non-owner when the file has no accessible attached resource', async () => {
    prisma.fileObject.findUnique.mockResolvedValue({
      id: 'file-1',
      storageKey: 'files/user-2/uuid-cbc.pdf',
      originalName: 'cbc.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1000n,
      checksum: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      category: 'DIAGNOSTIC_REPORT',
      status: 'AVAILABLE',
      uploadedById: 'user-2',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prisma.diagnosticReportFile.findMany.mockResolvedValue([]);
    prisma.receipt.findMany.mockResolvedValue([]);

    await expect(service.get(user, 'file-1')).rejects.toBeInstanceOf(ForbiddenException);
    expect(storage.createDownloadUrl).not.toHaveBeenCalled();
  });

  it('keeps a file unavailable until storage metadata and malware scanning succeed', async () => {
    const file = {
      id: 'file-1',
      storageKey: 'files/user-1/uuid-cbc.pdf',
      originalName: 'cbc.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1000n,
      checksum: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      category: 'DIAGNOSTIC_REPORT',
      status: 'UPLOADING',
      uploadedById: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prisma.fileObject.findUnique.mockResolvedValue(file);
    storage.inspectUpload.mockResolvedValue({
      sizeBytes: 1000,
      contentType: 'application/pdf',
      checksumSha256: file.checksum,
      scanStatus: 'PENDING',
    });

    await expect(service.complete(user, { fileId: 'file-1' })).resolves.toEqual({
      fileId: 'file-1',
      status: 'UPLOADING',
    });
    expect(prisma.fileObject.update).not.toHaveBeenCalled();
  });

  it('marks a validated, clean upload available', async () => {
    const file = {
      id: 'file-1',
      storageKey: 'files/user-1/uuid-cbc.pdf',
      originalName: 'cbc.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1000n,
      checksum: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      category: 'DIAGNOSTIC_REPORT',
      status: 'UPLOADING',
      uploadedById: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prisma.fileObject.findUnique.mockResolvedValue(file);
    storage.inspectUpload.mockResolvedValue({
      sizeBytes: 1000,
      contentType: 'application/pdf',
      checksumSha256: file.checksum,
      scanStatus: 'CLEAN',
    });

    await expect(service.complete(user, { fileId: 'file-1' })).resolves.toEqual({
      fileId: 'file-1',
      status: 'AVAILABLE',
    });
    expect(prisma.fileObject.update).toHaveBeenCalledWith({
      where: { id: 'file-1' },
      data: { status: 'AVAILABLE' },
    });
  });

  it('marks an infected upload as failed without making it available', async () => {
    const file = {
      id: 'file-1',
      storageKey: 'files/user-1/uuid-cbc.pdf',
      originalName: 'cbc.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1000n,
      checksum: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      category: 'DIAGNOSTIC_REPORT',
      status: 'UPLOADING',
      uploadedById: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prisma.fileObject.findUnique.mockResolvedValue(file);
    storage.inspectUpload.mockResolvedValue({
      sizeBytes: 1000,
      contentType: 'application/pdf',
      checksumSha256: file.checksum,
      scanStatus: 'INFECTED',
    });

    await expect(service.complete(user, { fileId: 'file-1' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.fileObject.update).toHaveBeenCalledWith({
      where: { id: 'file-1' },
      data: { status: 'FAILED' },
    });
  });

  it('rejects metadata mismatches without making the file available', async () => {
    prisma.fileObject.findUnique.mockResolvedValue({
      id: 'file-1',
      storageKey: 'files/user-1/uuid-cbc.pdf',
      originalName: 'cbc.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1000n,
      checksum: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      category: 'DIAGNOSTIC_REPORT',
      status: 'UPLOADING',
      uploadedById: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    storage.inspectUpload.mockResolvedValue({
      sizeBytes: 999,
      contentType: 'application/pdf',
      checksumSha256: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      scanStatus: 'CLEAN',
    });

    await expect(service.complete(user, { fileId: 'file-1' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.fileObject.update).not.toHaveBeenCalled();
  });
});
