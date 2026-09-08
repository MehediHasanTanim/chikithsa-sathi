import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { ErrorCode } from '@common/constants/error-codes';
import { DatabaseRepository, Repository } from '@database/database.repository';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@Repository() private readonly repository: DatabaseRepository) {}

  async me(userId: string) {
    const user = await this.repository.user.findUnique({ where: { id: userId } });
    if (!user)
      throw new NotFoundException({
        code: ErrorCode.AuthAccountNotFound,
        message: 'Account was not found',
        details: [],
      });
    return this.publicUser(user);
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    try {
      const user = await this.repository.user.update({
        where: { id: userId },
        data: {
          ...(dto.fullName !== undefined ? { fullName: dto.fullName } : {}),
          ...(dto.email !== undefined ? { email: dto.email } : {}),
          ...(dto.preferredLanguage !== undefined
            ? { preferredLanguage: dto.preferredLanguage }
            : {}),
        },
      });
      return this.publicUser(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException({
          code: ErrorCode.AuthEmailAlreadyExists,
          message: 'Email address is already registered',
          details: [],
        });
      }
      throw error;
    }
  }

  private publicUser(user: {
    id: string;
    phone: string;
    email: string | null;
    fullName: string;
    preferredLanguage: string;
    status: string;
  }) {
    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      fullName: user.fullName,
      preferredLanguage: user.preferredLanguage,
      status: user.status,
    };
  }
}
