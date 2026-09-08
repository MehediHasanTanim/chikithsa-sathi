import { Global, Module } from '@nestjs/common';

import { DATABASE_REPOSITORY } from '../database.repository';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService, { provide: DATABASE_REPOSITORY, useExisting: PrismaService }],
  exports: [PrismaService, DATABASE_REPOSITORY],
})
export class PrismaModule {}
