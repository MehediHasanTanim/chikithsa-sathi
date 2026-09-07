import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { UpdateProfessionalProfileDto } from './dto/update-professional-profile.dto';
import { DoctorsService } from './doctors.service';

@ApiTags('Doctors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'doctors', version: '1' })
export class DoctorsController {
  constructor(private readonly doctors: DoctorsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the authenticated doctor profile' })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.doctors.getProfile(user);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update the authenticated doctor profile' })
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateDoctorDto) {
    return this.doctors.updateProfile(user, dto);
  }

  @Get('me/professional-profile')
  @ApiOperation({ summary: 'Get detailed professional information' })
  professionalProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.doctors.getProfile(user);
  }

  @Patch('me/professional-profile')
  @ApiOperation({ summary: 'Update specialization, qualifications, and BMDC information' })
  updateProfessionalProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfessionalProfileDto,
  ) {
    return this.doctors.updateProfessionalProfile(user, dto);
  }
}
