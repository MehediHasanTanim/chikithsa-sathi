import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { ClinicalNotesService } from './clinical-notes.service';
import { CreateClinicalNoteDto } from './dto/create-clinical-note.dto';
import { UpdateClinicalNoteDto } from './dto/update-clinical-note.dto';

@ApiTags('Clinical Notes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class ClinicalNotesController {
  constructor(private readonly notes: ClinicalNotesService) {}

  @Post('encounters/:encounterId/notes')
  @ApiOperation({ summary: 'Add a clinical note to an encounter' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('encounterId') encounterId: string,
    @Body() dto: CreateClinicalNoteDto,
  ) {
    return this.notes.create(user, encounterId, dto);
  }

  @Get('encounters/:encounterId/notes')
  @ApiOperation({ summary: 'List clinical notes for an encounter' })
  list(@CurrentUser() user: AuthenticatedUser, @Param('encounterId') encounterId: string) {
    return this.notes.list(user, encounterId);
  }

  @Patch('notes/:noteId')
  @ApiOperation({ summary: 'Update a clinical note' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('noteId') noteId: string,
    @Body() dto: UpdateClinicalNoteDto,
  ) {
    return this.notes.update(user, noteId, dto);
  }
}
