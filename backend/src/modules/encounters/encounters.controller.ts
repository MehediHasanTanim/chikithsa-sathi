import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { EncountersService } from './encounters.service';
import { CreateEncounterDto } from './dto/create-encounter.dto';
import { UpdateEncounterDto } from './dto/update-encounter.dto';

@ApiTags('Encounters')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'encounters', version: '1' })
export class EncountersController {
  constructor(private readonly encounters: EncountersService) {}

  @Post()
  @ApiOperation({ summary: 'Start a clinical encounter' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateEncounterDto) {
    return this.encounters.create(user, dto);
  }

  @Get(':encounterId')
  @ApiOperation({ summary: 'Get an encounter' })
  get(@CurrentUser() user: AuthenticatedUser, @Param('encounterId') encounterId: string) {
    return this.encounters.getById(user, encounterId);
  }

  @Patch(':encounterId')
  @ApiOperation({ summary: 'Update editable encounter fields' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('encounterId') encounterId: string,
    @Body() dto: UpdateEncounterDto,
  ) {
    return this.encounters.update(user, encounterId, dto);
  }

  @Post(':encounterId/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start the encounter (DRAFT → IN_PROGRESS)' })
  start(@CurrentUser() user: AuthenticatedUser, @Param('encounterId') encounterId: string) {
    return this.encounters.start(user, encounterId);
  }

  @Post(':encounterId/ready-for-review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark the encounter ready for review' })
  readyForReview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('encounterId') encounterId: string,
  ) {
    return this.encounters.readyForReview(user, encounterId);
  }

  @Post(':encounterId/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete the encounter' })
  complete(@CurrentUser() user: AuthenticatedUser, @Param('encounterId') encounterId: string) {
    return this.encounters.complete(user, encounterId);
  }

  @Post(':encounterId/lock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lock the encounter (COMPLETED → LOCKED)' })
  lock(@CurrentUser() user: AuthenticatedUser, @Param('encounterId') encounterId: string) {
    return this.encounters.lock(user, encounterId);
  }
}
