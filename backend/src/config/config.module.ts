import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { configuration } from './configuration';
import { validateEnvironment } from './env.schema';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnvironment,
      load: [() => configuration(validateEnvironment(process.env))],
    }),
  ],
})
export class ApplicationConfigModule {}
