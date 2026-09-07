import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { MembershipStatus, UserRole } from '@prisma/client';

import { ErrorCode } from '@common/constants/error-codes';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { ResponseInterceptor } from '@common/interceptors/response.interceptor';
import { PrismaService } from '@database/prisma/prisma.service';
import { StorageService } from '@infrastructure/storage/storage.service';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { ChamberAccessGuard } from '@modules/chambers/guards/chamber-access.guard';
import { ChamberAccessService } from '@modules/chambers/services/chamber-access.service';
import { PermissionsService } from '@modules/permissions/permissions.service';
import { PermissionGuard } from '@modules/permissions/guards/permission.guard';
import { FilesController } from '@modules/files/files.controller';
import { FilesService } from '@modules/files/files.service';
import { StaffController } from '@modules/staff/staff.controller';
import { StaffService } from '@modules/staff/staff.service';

const user = { id: 'user-a' } as AuthenticatedUser;

class TestJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    context.switchToHttp().getRequest<{ user: AuthenticatedUser }>().user = user;
    return true;
  }
}

describe('Security boundaries (e2e)', () => {
  let app: NestFastifyApplication;

  const prisma = {
    fileObject: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    diagnosticReportFile: { findMany: jest.fn() },
    receipt: { findMany: jest.fn() },
    chamberMembership: { findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() },
    user: { findUnique: jest.fn() },
  };
  const storage = {
    createUploadUrl: jest.fn(),
    createDownloadUrl: jest.fn(),
    inspectUpload: jest.fn(),
  };
  const permissions = {
    requirePermissions: jest.fn(),
    rolePermissions: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [FilesController, StaffController],
      providers: [
        FilesService,
        StaffService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storage },
        { provide: PermissionsService, useValue: permissions },
        { provide: ChamberAccessService, useValue: { assertMember: jest.fn() } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestJwtAuthGuard)
      .overrideGuard(ChamberAccessGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(PermissionGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  beforeEach(() => jest.resetAllMocks());

  afterAll(async () => app?.close());

  it('denies a cross-chamber user an opaque file URL', async () => {
    prisma.fileObject.findUnique.mockResolvedValue({
      id: 'file-b',
      storageKey: 'files/user-b/report.pdf',
      originalName: 'report.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1000n,
      checksum: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      category: 'DIAGNOSTIC_REPORT',
      status: 'AVAILABLE',
      uploadedById: 'user-b',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prisma.diagnosticReportFile.findMany.mockResolvedValue([
      { report: { encounter: { chamberId: 'chamber-b' } } },
    ]);
    prisma.receipt.findMany.mockResolvedValue([]);
    permissions.requirePermissions.mockRejectedValue(
      new ForbiddenException({ code: ErrorCode.PermissionDenied, message: 'Denied', details: [] }),
    );

    const response = await app.inject({ method: 'GET', url: '/v1/files/file-b' });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      success: false,
      error: { code: ErrorCode.FileForbidden },
    });
    expect(storage.createDownloadUrl).not.toHaveBeenCalled();
  });

  it('rejects role escalation through the staff HTTP endpoint', async () => {
    prisma.chamberMembership.findUnique.mockResolvedValue({
      id: 'membership-b',
      chamberId: 'chamber-a',
      userId: 'user-b',
      role: UserRole.RECEPTIONIST,
      status: MembershipStatus.ACTIVE,
      invitedAt: null,
      joinedAt: new Date(),
      removedAt: null,
      invitedById: 'user-a',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    permissions.requirePermissions.mockResolvedValue({ role: UserRole.ASSISTANT_DOCTOR });
    permissions.rolePermissions.mockImplementation((role: UserRole) =>
      Promise.resolve(
        role === UserRole.ASSISTANT_DOCTOR
          ? new Set(['staff.manage'])
          : new Set(['staff.manage', 'payments.read']),
      ),
    );

    const response = await app.inject({
      method: 'PATCH',
      url: '/v1/staff/membership-b',
      payload: { role: UserRole.CHAMBER_MANAGER },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      success: false,
      error: { code: ErrorCode.PermissionDenied },
    });
    expect(prisma.chamberMembership.update).not.toHaveBeenCalled();
  });
});
