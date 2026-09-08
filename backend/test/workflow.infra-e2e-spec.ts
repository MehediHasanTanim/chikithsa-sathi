import { ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AIRequestStatus, UserStatus } from '@prisma/client';

import { AppModule } from '../src/app.module';
import { ErrorCode } from '@common/constants/error-codes';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { RequestRateLimitGuard } from '@common/guards/request-rate-limit.guard';
import { ResponseInterceptor } from '@common/interceptors/response.interceptor';
import { PrismaService } from '@database/prisma/prisma.service';
import { AuthRateLimitService } from '@modules/auth/services/auth-rate-limit.service';
import {
  AI_PROVIDER,
  AIProviderError,
  type AIProvider,
  type AIRequestPayload,
} from '@modules/ai/ai.types';
import { NotificationQueueService } from '@modules/notifications/notification-queue.service';
import { NotificationWorkerService } from '@modules/notifications/notification-worker.service';

const infrastructureE2E = process.env.RUN_INFRA_E2E === 'true';
const describeInfrastructure = infrastructureE2E ? describe : describe.skip;

type ApiResponse<T> = { success: boolean; data: T };
type TestMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

/**
 * This suite is intentionally opt-in: it uses PostgreSQL and Redis and proves
 * the cross-module workflow through the same HTTP guards used in production.
 */
describeInfrastructure('Doctor chamber workflow (infrastructure e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let doctorToken: string;
  let chamberId: string;
  let patientId: string;
  let encounterId: string;
  let prescriptionId: string;
  let paymentId: string;
  let failAi = false;

  const notificationQueue = { enqueue: jest.fn().mockResolvedValue(undefined) };
  const provider: AIProvider = {
    name: 'e2e-provider',
    defaultModel: 'e2e-model',
    generate: (request: AIRequestPayload) => {
      if (failAi)
        return Promise.reject(new AIProviderError('AI_UNAVAILABLE', 'Simulated provider outage'));
      const prescriptionDraft = request.messages.some(
        (message) =>
          message.role === 'system' && message.content.includes('exactly: clinicalSummary'),
      );
      if (prescriptionDraft) {
        return Promise.resolve({
          content: JSON.stringify({
            clinicalSummary: 'Review-required AI draft.',
            advice: 'Take after meals and follow up as directed.',
            items: [
              { medicineName: 'Paracetamol', dosage: '500 mg', frequencyText: 'Twice daily' },
            ],
          }),
          model: 'e2e-model',
          usage: { inputTokens: 11, outputTokens: 9, totalTokens: 20 },
        });
      }
      return Promise.resolve({
        content: 'This is a review-required clinical draft.',
        model: 'e2e-model',
        usage: { inputTokens: 8, outputTokens: 7, totalTokens: 15 },
      });
    },
  };

  beforeAll(async () => {
    expect(process.env.DATABASE_URL).toBe(process.env.DATABASE_URL_TEST);
    expect(process.env.DATABASE_URL).toContain('test');

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(AI_PROVIDER)
      .useValue(provider)
      .overrideProvider(AuthRateLimitService)
      .useValue({ enforce: jest.fn().mockResolvedValue(undefined) })
      .overrideProvider(RequestRateLimitGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideProvider(NotificationQueueService)
      .useValue(notificationQueue)
      .overrideProvider(NotificationWorkerService)
      .useValue({})
      .compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    prisma = app.get(PrismaService);

    // The runner rejects non-test URLs before it can reach this deliberately broad cleanup.
    await prisma.$executeRawUnsafe(
      'TRUNCATE TABLE "User", "Chamber", "Patient", "Diagnosis", "Medicine", "Role", "Permission" RESTART IDENTITY CASCADE',
    );
  });

  afterAll(async () => {
    await app?.close();
  });

  it('executes the doctor workflow from onboarding through encounter completion', async () => {
    const phone = '+8801712345678';
    const register = await request<{ userId: string; verificationRequired: boolean }>(
      'POST',
      '/v1/auth/register',
      {
        phone,
        email: 'doctor.e2e@example.test',
        fullName: 'Dr E2E',
        password: 'A-secure-password-123!',
      },
    );
    expect(register.statusCode).toBe(201);
    expect(register.body.data.verificationRequired).toBe(true);
    expect(
      await prisma.otpVerification.count({ where: { userId: register.body.data.userId } }),
    ).toBe(1);

    // The OTP transport is external; registration and OTP persistence are verified above.
    // Marking this isolated test account active allows the rest of the authenticated workflow.
    await prisma.user.update({
      where: { id: register.body.data.userId },
      data: { status: UserStatus.ACTIVE },
    });
    const login = await request<{ accessToken: string }>('POST', '/v1/auth/login', {
      phone,
      password: 'A-secure-password-123!',
    });
    expect(login.statusCode).toBe(200);
    doctorToken = login.body.data.accessToken;

    expect((await request('GET', '/v1/doctors/me', undefined, doctorToken)).statusCode).toBe(200);
    expect(
      (
        await request(
          'PATCH',
          '/v1/doctors/me/professional-profile',
          { specialization: 'Medicine' },
          doctorToken,
        )
      ).statusCode,
    ).toBe(200);

    const chamber = await request<{ id: string }>(
      'POST',
      '/v1/chambers',
      { name: 'E2E Chamber' },
      doctorToken,
    );
    expect(chamber.statusCode).toBe(201);
    chamberId = chamber.body.data.id;

    const scheduledAt = futureBangladeshSlot();
    const schedule = await request(
      'POST',
      `/v1/chambers/${chamberId}/schedules`,
      {
        dayOfWeek: bangladeshDayOfWeek(scheduledAt),
        startTime: '10:00',
        endTime: '12:00',
        slotDurationMinutes: 15,
      },
      doctorToken,
    );
    expect(schedule.statusCode).toBe(201);

    const staff = await createActiveUser('+8801812345678', 'staff.e2e@example.test', 'E2E Staff');
    const invitation = await request<{ id: string; status: string }>(
      'POST',
      `/v1/chambers/${chamberId}/staff/invite`,
      { phone: staff.phone, role: 'RECEPTIONIST' },
      doctorToken,
    );
    expect(invitation.statusCode).toBe(201);
    expect(invitation.body.data.status).toBe('INVITED');

    const patient = await request<{ id: string }>(
      'POST',
      '/v1/patients',
      { chamberId, fullName: 'E2E Patient', phone: '+8801912345678', gender: 'FEMALE' },
      doctorToken,
    );
    expect(patient.statusCode).toBe(201);
    patientId = patient.body.data.id;

    const appointment = await request<{ id: string; status: string }>(
      'POST',
      '/v1/appointments',
      { chamberId, patientId, scheduledAt: scheduledAt.toISOString(), type: 'NEW_PATIENT' },
      doctorToken,
    );
    expect(appointment.statusCode).toBe(201);
    const confirmed = await request<{ status: string }>(
      'POST',
      `/v1/appointments/${appointment.body.data.id}/confirm`,
      {},
      doctorToken,
    );
    expect(confirmed.body.data.status).toBe('CONFIRMED');

    const checkIn = await request<{ queueEntryId: string; status: string }>(
      'POST',
      '/v1/queue/check-in',
      { chamberId, patientId, appointmentId: appointment.body.data.id },
      doctorToken,
    );
    expect(checkIn.statusCode).toBe(200);
    const queueEntryId = checkIn.body.data.queueEntryId;
    expect(
      (await request('POST', `/v1/queue/${queueEntryId}/call`, {}, doctorToken)).body.data.status,
    ).toBe('CALLED');
    expect(
      (await request('POST', `/v1/queue/${queueEntryId}/start`, {}, doctorToken)).body.data.status,
    ).toBe('IN_CONSULTATION');

    const encounter = await request<{ id: string; status: string }>(
      'POST',
      '/v1/encounters',
      { chamberId, patientId, appointmentId: appointment.body.data.id, queueEntryId },
      doctorToken,
    );
    expect(encounter.statusCode).toBe(201);
    encounterId = encounter.body.data.id;
    expect(
      (await request('POST', `/v1/encounters/${encounterId}/start`, {}, doctorToken)).body.data
        .status,
    ).toBe('IN_PROGRESS');

    expect(
      (
        await request(
          'POST',
          `/v1/encounters/${encounterId}/vitals`,
          { systolicBp: 120, diastolicBp: 80, weightKg: 65 },
          doctorToken,
        )
      ).statusCode,
    ).toBe(201);
    expect(
      (
        await request(
          'POST',
          `/v1/encounters/${encounterId}/notes`,
          { type: 'HISTORY', content: 'Intermittent headache.' },
          doctorToken,
        )
      ).statusCode,
    ).toBe(201);
    const diagnosis = await prisma.diagnosis.create({
      data: { name: 'E2E Headache', code: 'E2E-001' },
    });
    expect(
      (
        await request(
          'POST',
          `/v1/encounters/${encounterId}/diagnoses`,
          { diagnosisId: diagnosis.id, type: 'PRIMARY' },
          doctorToken,
        )
      ).statusCode,
    ).toBe(201);
    expect(
      (
        await request(
          'POST',
          `/v1/encounters/${encounterId}/investigations`,
          { name: 'CBC' },
          doctorToken,
        )
      ).statusCode,
    ).toBe(201);

    const aiDraft = await request<{
      prescription: { id: string; status: string };
      provenance: { requestId: string };
    }>(
      'POST',
      '/v1/ai/prescription-draft',
      { chamberId, patientId, encounterId, language: 'en' },
      doctorToken,
    );
    expect(aiDraft.statusCode).toBe(201);
    expect(aiDraft.body.data.prescription.status).toBe('AI_ASSISTED');
    prescriptionId = aiDraft.body.data.prescription.id;
    expect(
      (
        await request(
          'POST',
          `/v1/prescriptions/${prescriptionId}/review`,
          { reviewed: true },
          doctorToken,
        )
      ).body.data.status,
    ).toBe('REVIEW_REQUIRED');
    expect(
      (
        await request(
          'POST',
          `/v1/prescriptions/${prescriptionId}/finalize`,
          { confirmation: true },
          doctorToken,
        )
      ).body.data.status,
    ).toBe('FINALIZED');

    const payment = await request<{ id: string; receiptNumber: string | null }>(
      'POST',
      '/v1/payments',
      {
        chamberId,
        patientId,
        encounterId,
        appointmentId: appointment.body.data.id,
        amount: 700,
        method: 'CASH',
      },
      doctorToken,
      { 'idempotency-key': 'e2e-payment-1' },
    );
    expect(payment.statusCode).toBe(201);
    paymentId = payment.body.data.id;
    expect(
      (await request('GET', `/v1/payments/${paymentId}/receipt`, undefined, doctorToken))
        .statusCode,
    ).toBe(200);
    expect(
      (await request('POST', `/v1/prescriptions/${prescriptionId}/deliver`, {}, doctorToken)).body
        .data.status,
    ).toBe('DELIVERED');
    expect(
      (await request('POST', `/v1/encounters/${encounterId}/ready-for-review`, {}, doctorToken))
        .body.data.status,
    ).toBe('READY_FOR_REVIEW');
    expect(
      (await request('POST', `/v1/encounters/${encounterId}/complete`, {}, doctorToken)).body.data
        .status,
    ).toBe('COMPLETED');
    expect(
      (await request('POST', `/v1/queue/${queueEntryId}/complete`, {}, doctorToken)).body.data
        .status,
    ).toBe('COMPLETED');
  });

  it('enforces isolation, immutable clinical states, idempotency, and AI failures', async () => {
    const outsider = await createActiveUser(
      '+8801612345678',
      'outsider.e2e@example.test',
      'Outsider',
    );
    const outsiderLogin = await request<{ accessToken: string }>('POST', '/v1/auth/login', {
      phone: outsider.phone,
      password: 'A-secure-password-123!',
    });
    const outsiderToken = outsiderLogin.body.data.accessToken;

    const crossChamber = await request(
      'GET',
      `/v1/encounters/${encounterId}`,
      undefined,
      outsiderToken,
    );
    expect(crossChamber.statusCode).toBe(403);
    expect(crossChamber.body.error.code).toBe(ErrorCode.ChamberForbidden);

    const finalizedEdit = await request(
      'PATCH',
      `/v1/prescriptions/${prescriptionId}`,
      { advice: 'edited' },
      doctorToken,
    );
    expect(finalizedEdit.statusCode).toBe(400);

    const repeatedPayment = await request<{ id: string }>(
      'POST',
      '/v1/payments',
      { chamberId, patientId, encounterId, amount: 700, method: 'CASH' },
      doctorToken,
      { 'idempotency-key': 'e2e-payment-1' },
    );
    expect(repeatedPayment.statusCode).toBe(201);
    expect(repeatedPayment.body.data.id).toBe(paymentId);
    expect(
      await prisma.payment.count({ where: { chamberId, idempotencyKey: 'e2e-payment-1' } }),
    ).toBe(1);

    failAi = true;
    const failedAi = await request(
      'POST',
      '/v1/ai/clinical-chat',
      { chamberId, patientId, encounterId, question: 'Summarize the encounter.' },
      doctorToken,
    );
    failAi = false;
    expect(failedAi.statusCode).toBe(503);
    expect(
      await prisma.aIRequest.count({ where: { chamberId, status: AIRequestStatus.FAILED } }),
    ).toBe(1);
  });

  async function createActiveUser(
    phone: string,
    email: string,
    fullName: string,
  ): Promise<{ phone: string }> {
    const registration = await request<{ userId: string }>('POST', '/v1/auth/register', {
      phone,
      email,
      fullName,
      password: 'A-secure-password-123!',
    });
    expect(registration.statusCode).toBe(201);
    await prisma.user.update({
      where: { id: registration.body.data.userId },
      data: { status: UserStatus.ACTIVE },
    });
    return { phone };
  }

  async function request<T = { status: string }>(
    method: TestMethod,
    url: string,
    payload?: Record<string, unknown>,
    token?: string,
    headers: Record<string, string> = {},
  ): Promise<{ statusCode: number; body: ApiResponse<T> & { error: { code: string } } }> {
    const response = await app.inject({
      method,
      url,
      ...(payload === undefined ? {} : { payload }),
      headers: { ...headers, ...(token ? { authorization: `Bearer ${token}` } : {}) },
    });
    return { statusCode: response.statusCode, body: response.json() };
  }
});

function futureBangladeshSlot(): Date {
  const scheduledAt = new Date();
  scheduledAt.setUTCDate(scheduledAt.getUTCDate() + 7);
  scheduledAt.setUTCHours(4, 0, 0, 0); // 10:00 in Asia/Dhaka
  return scheduledAt;
}

function bangladeshDayOfWeek(date: Date): number {
  const day = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Dhaka', weekday: 'short' }).format(
    date,
  );
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(day);
}
