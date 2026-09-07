import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChamberStatus, UserRole } from '@prisma/client';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { CurrentChamber } from './decorators/current-chamber.decorator';
import { RequireChamberRole } from './decorators/require-chamber-role.decorator';
import { ChamberAccessGuard } from './guards/chamber-access.guard';
import type { ChamberWithOwner } from './services/chamber-access.service';
import { ChambersService } from './chambers.service';
import { CreateChamberDto } from './dto/create-chamber.dto';
import { UpdateChamberDto } from './dto/update-chamber.dto';

@ApiTags('Chambers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'chambers', version: '1' })
export class ChambersController {
  constructor(private readonly chambers: ChambersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a chamber and become its owner' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateChamberDto) {
    return this.chambers.create(user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List chambers accessible to the current user' })
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.chambers.list(user);
  }

  @Get(':chamberId')
  @UseGuards(ChamberAccessGuard)
  @ApiOperation({ summary: 'Get chamber details' })
  get(@CurrentChamber() chamber: ChamberWithOwner) {
    return this.chambers.toPublic(chamber);
  }

  @Patch(':chamberId')
  @UseGuards(ChamberAccessGuard)
  @RequireChamberRole(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Update a chamber' })
  update(@Param('chamberId') chamberId: string, @Body() dto: UpdateChamberDto) {
    return this.chambers.update(chamberId, dto);
  }

  @Post(':chamberId/activate')
  @UseGuards(ChamberAccessGuard)
  @RequireChamberRole(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Activate a chamber' })
  activate(@Param('chamberId') chamberId: string) {
    return this.chambers.setStatus(chamberId, ChamberStatus.ACTIVE);
  }

  @Post(':chamberId/deactivate')
  @UseGuards(ChamberAccessGuard)
  @RequireChamberRole(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Deactivate a chamber' })
  deactivate(@Param('chamberId') chamberId: string) {
    return this.chambers.setStatus(chamberId, ChamberStatus.INACTIVE);
  }
}
