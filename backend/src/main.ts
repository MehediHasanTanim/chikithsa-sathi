import { Logger, RequestMethod, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import helmet from '@fastify/helmet';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { LoggingInterceptor } from '@common/interceptors/logging.interceptor';
import { ResponseInterceptor } from '@common/interceptors/response.interceptor';
import { getOrCreateRequestId, REQUEST_ID_HEADER } from '@common/middleware/request-id.hook';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false, trustProxy: process.env.TRUST_PROXY === 'true' }),
    { bufferLogs: true },
  );
  const config = app.get(ConfigService);

  app.enableShutdownHooks();
  await app.register(helmet);
  const corsOrigins = config.getOrThrow<string[]>('app.corsOrigins');
  if (corsOrigins.length > 0) {
    app.enableCors({
      origin: corsOrigins,
      credentials: true,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    });
  }
  const fastify = app.getHttpAdapter().getInstance();
  fastify.addHook('onRequest', (request, reply, done) => {
    request.requestId = getOrCreateRequestId(request);
    reply.header(REQUEST_ID_HEADER, request.requestId);
    done();
  });

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'health', method: RequestMethod.ALL },
      { path: 'health/{*path}', method: RequestMethod.ALL },
    ],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(app.get(LoggingInterceptor), app.get(ResponseInterceptor));

  if (config.getOrThrow<boolean>('app.enableSwagger')) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle(config.getOrThrow<string>('app.name'))
        .setDescription('Chamber Management REST API')
        .setVersion('1.0')
        .build(),
    );
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = config.getOrThrow<number>('app.port');
  await app.listen(port, '0.0.0.0');
  Logger.log(`API listening on 0.0.0.0:${port}`, 'Bootstrap');
}

void bootstrap();
