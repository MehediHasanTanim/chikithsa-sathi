import { VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { ResponseInterceptor } from '@common/interceptors/response.interceptor';
import { getOrCreateRequestId, REQUEST_ID_HEADER } from '@common/middleware/request-id.hook';
import { PrismaService } from '@database/prisma/prisma.service';
import { RedisService } from '@infrastructure/cache/redis.service';
import { StorageService } from '@infrastructure/storage/storage.service';
import { HealthModule } from '@modules/health/health.module';

describe('Health endpoints (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [HealthModule] })
      .overrideProvider(PrismaService)
      .useValue({ ping: jest.fn().mockResolvedValue(undefined) })
      .overrideProvider(RedisService)
      .useValue({ ping: jest.fn().mockResolvedValue(undefined) })
      .overrideProvider(StorageService)
      .useValue({})
      .compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    const fastify = app.getHttpAdapter().getInstance();
    fastify.addHook('onRequest', (incomingRequest, reply, done) => {
      incomingRequest.requestId = getOrCreateRequestId(incomingRequest);
      reply.header(REQUEST_ID_HEADER, incomingRequest.requestId);
      done();
    });
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => app.close());

  it('serves an unversioned liveness probe with a request ID', async () => {
    const response = await app.inject({ method: 'GET', url: '/health/live' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ success: true, data: { status: 'ok' } });
    expect(response.headers[REQUEST_ID_HEADER]).toBeTruthy();
  });
});
