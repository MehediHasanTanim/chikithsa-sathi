import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { FilesService } from './files.service';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';

@ApiTags('Files')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'files', version: '1' })
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Post('upload-url')
  @ApiOperation({ summary: 'Request a pre-signed upload URL' })
  createUploadUrl(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateUploadUrlDto) {
    return this.files.createUploadUrl(user, dto);
  }

  @Post('complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark an upload as complete' })
  complete(@CurrentUser() user: AuthenticatedUser, @Body() dto: CompleteUploadDto) {
    return this.files.complete(user, dto);
  }

  @Get(':fileId')
  @ApiOperation({ summary: 'Get file metadata and a temporary download URL' })
  get(@CurrentUser() user: AuthenticatedUser, @Param('fileId') fileId: string) {
    return this.files.get(user, fileId);
  }

  @Delete(':fileId')
  @ApiOperation({ summary: 'Delete a file' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('fileId') fileId: string) {
    return this.files.remove(user, fileId);
  }
}
