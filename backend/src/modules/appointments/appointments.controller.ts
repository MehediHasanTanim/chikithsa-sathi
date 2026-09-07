import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { AppointmentsService } from './appointments.service';
import { AppointmentQueryDto } from './dto/appointment-query.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@ApiTags('Appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'appointments', version: '1' })
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Book an appointment' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAppointmentDto) {
    return this.appointments.create(user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List appointments for a chamber' })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: AppointmentQueryDto) {
    return this.appointments.list(user, query);
  }

  @Get(':appointmentId')
  @ApiOperation({ summary: 'Get appointment details' })
  get(@CurrentUser() user: AuthenticatedUser, @Param('appointmentId') appointmentId: string) {
    return this.appointments.getById(user, appointmentId);
  }

  @Patch(':appointmentId')
  @ApiOperation({ summary: 'Update appointment details' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appointmentId') appointmentId: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointments.update(user, appointmentId, dto);
  }

  @Post(':appointmentId/reschedule')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reschedule an appointment' })
  reschedule(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appointmentId') appointmentId: string,
    @Body() dto: RescheduleAppointmentDto,
  ) {
    return this.appointments.reschedule(user, appointmentId, dto);
  }

  @Post(':appointmentId/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an appointment' })
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appointmentId') appointmentId: string,
    @Body() dto: CancelAppointmentDto,
  ) {
    return this.appointments.cancel(user, appointmentId, dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post(':appointmentId/confirm')
  @ApiOperation({ summary: 'Confirm a booked appointment' })
  confirm(@CurrentUser() user: AuthenticatedUser, @Param('appointmentId') appointmentId: string) {
    return this.appointments.confirm(user, appointmentId);
  }
}
