import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import { AnalyticsDashboardQueryDto } from './dto/analytics-dashboard-query.dto';
import { AnalyticsRangeQueryDto } from './dto/analytics-range-query.dto';
import type { FastifyReply } from 'fastify';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'analytics', version: '1' })
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get chamber operational dashboard metrics' })
  dashboard(@CurrentUser() user: AuthenticatedUser, @Query() query: AnalyticsDashboardQueryDto) {
    return this.analytics.dashboard(user, query);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get chamber payment and refund totals' })
  revenue(@CurrentUser() user: AuthenticatedUser, @Query() query: AnalyticsRangeQueryDto) {
    return this.analytics.revenue(user, query);
  }

  @Get('patients')
  @ApiOperation({ summary: 'Get chamber patient volume metrics' })
  patients(@CurrentUser() user: AuthenticatedUser, @Query() query: AnalyticsRangeQueryDto) {
    return this.analytics.patients(user, query);
  }

  @Get('export')
  @ApiOperation({ summary: 'Download basic chamber analytics as CSV' })
  async export(@CurrentUser() user: AuthenticatedUser, @Query() query: AnalyticsRangeQueryDto, @Res({ passthrough: true }) reply: FastifyReply) {
    const csv = await this.analytics.exportCsv(user, query);
    reply.header('Content-Type', 'text/csv; charset=utf-8');
    reply.header('Content-Disposition', 'attachment; filename="chamber-analytics.csv"');
    return csv;
  }
}
