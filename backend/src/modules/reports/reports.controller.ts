import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Post('encounters/:encounterId/reports')
  @ApiOperation({ summary: 'Attach a diagnostic report to an encounter' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('encounterId') encounterId: string,
    @Body() dto: CreateReportDto,
  ) {
    return this.reports.create(user, encounterId, dto);
  }

  @Get('encounters/:encounterId/reports')
  @ApiOperation({ summary: 'List diagnostic reports for an encounter' })
  list(@CurrentUser() user: AuthenticatedUser, @Param('encounterId') encounterId: string) {
    return this.reports.list(user, encounterId);
  }

  @Get('reports/:reportId')
  @ApiOperation({ summary: 'Get a diagnostic report' })
  get(@CurrentUser() user: AuthenticatedUser, @Param('reportId') reportId: string) {
    return this.reports.get(user, reportId);
  }
}
