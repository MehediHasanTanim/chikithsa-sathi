import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { ChamberAccessGuard } from '@modules/chambers/guards/chamber-access.guard';
import { PermissionsService } from './permissions.service';

@ApiTags('Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class PermissionsController {
  constructor(private readonly permissions: PermissionsService) {}

  @Get('chambers/:chamberId/permissions')
  @UseGuards(ChamberAccessGuard)
  @ApiOperation({ summary: 'List all permissions available in the system' })
  list() {
    return this.permissions.listPermissions();
  }

  @Get('chambers/:chamberId/my-permissions')
  @UseGuards(ChamberAccessGuard)
  @ApiOperation({ summary: 'Get the current user permissions for a chamber' })
  my(@CurrentUser() user: AuthenticatedUser, @Param('chamberId') chamberId: string) {
    return this.permissions.myPermissions(user.id, chamberId);
  }
}
