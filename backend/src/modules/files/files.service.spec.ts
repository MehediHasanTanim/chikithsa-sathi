import { BadRequestException } from '@nestjs/common';

import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { FilesService } from './files.service';

const user = { id: 'user-1' } as AuthenticatedUser;

describe('FilesService', () => {
  const prisma = {
    fileObject: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    chamberMembership: { findFirst: jest.fn() },
  };
  const storage = { createUploadUrl: jest.fn(), createDownloadUrl: jest.fn() };
  const service = new FilesService(prisma as never, storage as never);

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
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a file whose extension does not match its content type', async () => {
    await expect(
      service.createUploadUrl(user, {
        fileName: 'notes.txt',
        contentType: 'application/pdf',
        sizeBytes: 100,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
