import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Req,
  UnauthorizedException,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import type { FastifyRequest } from 'fastify';

import { MetricsService } from '@common/metrics/metrics.service';

@Controller({ path: 'metrics', version: VERSION_NEUTRAL })
export class MetricsController {
  constructor(
    private readonly config: ConfigService,
    private readonly metrics: MetricsService,
  ) {}

  @Get()
  @Header('content-type', 'text/plain; version=0.0.4; charset=utf-8')
  scrape(@Req() request: FastifyRequest): string {
    const expected = this.config.get<string>('app.metricsToken');
    if (!expected) throw new NotFoundException();
    const provided = this.bearerToken(request.headers.authorization);
    if (!provided || !this.sameSecret(provided, expected)) throw new UnauthorizedException();
    return this.metrics.prometheus();
  }

  private bearerToken(header: string | string[] | undefined): string | undefined {
    const value = Array.isArray(header) ? header[0] : header;
    return value?.startsWith('Bearer ') ? value.slice('Bearer '.length) : undefined;
  }

  private sameSecret(actual: string, expected: string): boolean {
    const actualBuffer = Buffer.from(actual);
    const expectedBuffer = Buffer.from(expected);
    return (
      actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
    );
  }
}
