import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { ChamberAccessGuard } from '@modules/chambers/guards/chamber-access.guard';
import { RequirePermission } from '@modules/permissions/decorators/require-permission.decorator';
import { PermissionGuard } from '@modules/permissions/guards/permission.guard';
import { StaffService } from './staff.service';
import { InviteStaffDto } from './dto/invite-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

@ApiTags('Staff')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  @Get('chambers/:chamberId/staff')
  @UseGuards(ChamberAccessGuard, PermissionGuard)
  @RequirePermission('staff.read')
  @ApiOperation({ summary: 'List chamber staff' })
  list(@Param('chamberId') chamberId: string) {
    return this.staff.list(chamberId);
  }

  @Post('chambers/:chamberId/staff/invite')
  @UseGuards(ChamberAccessGuard, PermissionGuard)
  @RequirePermission('staff.invite')
  @ApiOperation({ summary: 'Invite a user to join a chamber as staff' })
  invite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('chamberId') chamberId: string,
    @Body() dto: InviteStaffDto,
  ) {
    return this.staff.invite(user, chamberId, dto);
  }

  @Patch('staff/:membershipId')
  @ApiOperation({ summary: 'Update a staff membership role or status' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('membershipId') membershipId: string,
    @Body() dto: UpdateStaffDto,
  ) {
    return this.staff.update(user, membershipId, dto);
  }

  @Delete('staff/:membershipId')
  @ApiOperation({ summary: 'Remove a staff member from a chamber' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('membershipId') membershipId: string) {
    return this.staff.remove(user, membershipId);
  }

  @Post('staff/:membershipId/resend-invitation')
  @ApiOperation({ summary: 'Resend a pending staff invitation' })
  resend(@CurrentUser() user: AuthenticatedUser, @Param('membershipId') membershipId: string) {
    return this.staff.resendInvitation(user, membershipId);
  }
}
