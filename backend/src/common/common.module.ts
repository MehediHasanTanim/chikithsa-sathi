import { Global, Module } from '@nestjs/common';

import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { ResponseInterceptor } from './interceptors/response.interceptor';

@Global()
@Module({
  providers: [LoggingInterceptor, ResponseInterceptor],
  exports: [LoggingInterceptor, ResponseInterceptor],
})
export class CommonModule {}
