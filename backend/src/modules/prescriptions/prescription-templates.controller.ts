import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { CreatePrescriptionTemplateDto, UpdatePrescriptionTemplateDto } from './dto/prescription-template.dto';
import { PrescriptionTemplatesService } from './prescription-templates.service';

@ApiTags('Prescription templates') @ApiBearerAuth() @UseGuards(JwtAuthGuard)
@Controller({ path: 'prescription-templates', version: '1' })
export class PrescriptionTemplatesController {
  constructor(private readonly templates: PrescriptionTemplatesService) {}
  @Post() @ApiOperation({ summary: 'Create a reusable prescription template' }) create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePrescriptionTemplateDto) { return this.templates.create(user, dto); }
  @Get() @ApiOperation({ summary: 'List the current doctor templates for a chamber' }) list(@CurrentUser() user: AuthenticatedUser, @Query('chamberId') chamberId: string) { return this.templates.list(user, chamberId); }
  @Patch(':id') update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdatePrescriptionTemplateDto) { return this.templates.update(user, id, dto); }
  @Post(':id/apply/:encounterId') @ApiOperation({ summary: 'Create a draft prescription from a saved template' }) apply(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Param('encounterId') encounterId: string) { return this.templates.apply(user, id, encounterId); }
  @Delete(':id') remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) { return this.templates.remove(user, id); }
}
