import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { MedicinesService } from './medicines.service';
import { AddFavoriteDto } from './dto/add-favorite.dto';

@ApiTags('Medicines')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class MedicinesController {
  constructor(private readonly medicines: MedicinesService) {}

  @Get('medicines/search')
  @ApiOperation({ summary: 'Search the medicine catalog' })
  search(@CurrentUser() user: AuthenticatedUser, @Query('q') q?: string) {
    return this.medicines.search(user, q);
  }

  @Get('doctors/me/medicine-favorites')
  @ApiOperation({ summary: 'List the current doctor medicine favorites' })
  listFavorites(@CurrentUser() user: AuthenticatedUser) {
    return this.medicines.listFavorites(user);
  }

  @Post('doctors/me/medicine-favorites')
  @ApiOperation({ summary: 'Add a medicine to the current doctor favorites' })
  addFavorite(@CurrentUser() user: AuthenticatedUser, @Body() dto: AddFavoriteDto) {
    return this.medicines.addFavorite(user, dto);
  }

  @Delete('doctors/me/medicine-favorites/:favoriteId')
  @ApiOperation({ summary: 'Remove a medicine favorite' })
  removeFavorite(@CurrentUser() user: AuthenticatedUser, @Param('favoriteId') favoriteId: string) {
    return this.medicines.removeFavorite(user, favoriteId);
  }
}
