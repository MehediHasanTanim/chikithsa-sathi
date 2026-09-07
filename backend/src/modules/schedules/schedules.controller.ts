import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RequireChamberRole } from '@modules/chambers/decorators/require-chamber-role.decorator';
import { ChamberAccessGuard } from '@modules/chambers/guards/chamber-access.guard';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@ApiTags('Schedules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class SchedulesController {
  constructor(private readonly schedules: SchedulesService) {}

  @Get('chambers/:chamberId/schedules')
  @UseGuards(ChamberAccessGuard)
  @ApiOperation({ summary: 'List weekly schedules for a chamber' })
  list(@CurrentUser() user: AuthenticatedUser, @Param('chamberId') chamberId: string) {
    return this.schedules.list(user, chamberId);
  }

  @Post('chambers/:chamberId/schedules')
  @UseGuards(ChamberAccessGuard)
  @RequireChamberRole(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Create a weekly schedule for a chamber' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('chamberId') chamberId: string,
    @Body() dto: CreateScheduleDto,
  ) {
    return this.schedules.create(user, chamberId, dto);
  }

  @Patch('schedules/:scheduleId')
  @ApiOperation({ summary: 'Update a schedule' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('scheduleId') scheduleId: string,
    @Body() dto: UpdateScheduleDto,
  ) {
    return this.schedules.update(user, scheduleId, dto);
  }

  @Delete('schedules/:scheduleId')
  @ApiOperation({ summary: 'Delete a schedule' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('scheduleId') scheduleId: string) {
    return this.schedules.remove(user, scheduleId);
  }
}
