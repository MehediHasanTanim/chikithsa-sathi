import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { RequestRateLimitGuard } from './guards/request-rate-limit.guard';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { MetricsService } from './metrics/metrics.service';

@Global()
@Module({
  providers: [
    MetricsService,
    RequestRateLimitGuard,
    LoggingInterceptor,
    ResponseInterceptor,
    { provide: APP_GUARD, useExisting: RequestRateLimitGuard },
  ],
  exports: [MetricsService, LoggingInterceptor, ResponseInterceptor],
})
export class CommonModule {}
