import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { InvestigationsService } from './investigations.service';
import { CreateInvestigationDto } from './dto/create-investigation.dto';
import { UpdateInvestigationDto } from './dto/update-investigation.dto';

@ApiTags('Investigations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class InvestigationsController {
  constructor(private readonly investigations: InvestigationsService) {}

  @Get('investigations/catalog')
  @ApiOperation({ summary: 'List previously used investigation names' })
  catalog(@CurrentUser() user: AuthenticatedUser) {
    return this.investigations.catalog(user);
  }

  @Post('encounters/:encounterId/investigations')
  @ApiOperation({ summary: 'Order an investigation for an encounter' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('encounterId') encounterId: string,
    @Body() dto: CreateInvestigationDto,
  ) {
    return this.investigations.create(user, encounterId, dto);
  }

  @Get('encounters/:encounterId/investigations')
  @ApiOperation({ summary: 'List investigations for an encounter' })
  list(@CurrentUser() user: AuthenticatedUser, @Param('encounterId') encounterId: string) {
    return this.investigations.list(user, encounterId);
  }

  @Patch('investigations/:investigationId')
  @ApiOperation({ summary: 'Update an investigation' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('investigationId') investigationId: string,
    @Body() dto: UpdateInvestigationDto,
  ) {
    return this.investigations.update(user, investigationId, dto);
  }
}
