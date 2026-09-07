import { Injectable, NotFoundException } from '@nestjs/common';
import { ClinicalNote } from '@prisma/client';

import { ErrorCode } from '@common/constants/error-codes';
import { PrismaService } from '@database/prisma/prisma.service';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { ClinicalAccessService } from './clinical-access.service';
import type { CreateClinicalNoteDto } from './dto/create-clinical-note.dto';
import type { UpdateClinicalNoteDto } from './dto/update-clinical-note.dto';

@Injectable()
export class ClinicalNotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ClinicalAccessService,
  ) {}

  async create(
    user: AuthenticatedUser,
    encounterId: string,
    dto: CreateClinicalNoteDto,
  ): Promise<ClinicalNote> {
    await this.access.assertWrite(user, encounterId);
    return this.prisma.clinicalNote.create({
      data: {
        encounterId,
        type: dto.type,
        content: dto.content,
        contentBangla: dto.contentBangla,
        createdById: user.id,
      },
    });
  }

  async list(user: AuthenticatedUser, encounterId: string): Promise<ClinicalNote[]> {
    await this.access.assertRead(user, encounterId);
    return this.prisma.clinicalNote.findMany({
      where: { encounterId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(
    user: AuthenticatedUser,
    noteId: string,
    dto: UpdateClinicalNoteDto,
  ): Promise<ClinicalNote> {
    const note = await this.findNote(noteId);
    await this.access.assertWrite(user, note.encounterId);
    return this.prisma.clinicalNote.update({
      where: { id: noteId },
      data: {
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.content !== undefined ? { content: dto.content } : {}),
        ...(dto.contentBangla !== undefined ? { contentBangla: dto.contentBangla } : {}),
      },
    });
  }

  private async findNote(noteId: string): Promise<ClinicalNote> {
    const note = await this.prisma.clinicalNote.findUnique({ where: { id: noteId } });
    if (!note) {
      throw new NotFoundException({
        code: ErrorCode.NoteNotFound,
        message: 'Clinical note was not found',
        details: [],
      });
    }
    return note;
  }
}
