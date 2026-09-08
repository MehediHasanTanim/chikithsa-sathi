import { Inject } from '@nestjs/common';

import type { PrismaService } from './prisma/prisma.service';

/**
 * Application-facing database port. Domain services depend on this token rather
 * than importing the Prisma implementation, keeping persistence replaceable in
 * tests and at future storage boundaries.
 */
export const DATABASE_REPOSITORY = Symbol('DATABASE_REPOSITORY');
export type DatabaseRepository = PrismaService;
export const Repository = () => Inject(DATABASE_REPOSITORY);
