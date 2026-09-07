import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { QueueService } from './queue.service';
import { CheckInDto } from './dto/check-in.dto';
import { QueueQueryDto } from './dto/queue-query.dto';
import { SkipQueueEntryDto } from './dto/skip-queue-entry.dto';

@ApiTags('Queue')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class QueueController {
  constructor(private readonly queue: QueueService) {}

  @Get('queue/today')
  @ApiOperation({ summary: 'Get the current daily queue for a chamber' })
  today(@CurrentUser() user: AuthenticatedUser, @Query() query: QueueQueryDto) {
    return this.queue.today(user, query);
  }

  @Post('queue/check-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check a patient into the daily queue' })
  checkIn(@CurrentUser() user: AuthenticatedUser, @Body() dto: CheckInDto) {
    return this.queue.checkIn(user, dto);
  }

  @Post('queue/:queueEntryId/call')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Call the next patient' })
  call(@CurrentUser() user: AuthenticatedUser, @Param('queueEntryId') queueEntryId: string) {
    return this.queue.call(user, queueEntryId);
  }

  @Post('queue/:queueEntryId/recall')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recall a skipped or unresponsive patient' })
  recall(@CurrentUser() user: AuthenticatedUser, @Param('queueEntryId') queueEntryId: string) {
    return this.queue.recall(user, queueEntryId);
  }

  @Post('queue/:queueEntryId/skip')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Skip a queued patient' })
  skip(
    @CurrentUser() user: AuthenticatedUser,
    @Param('queueEntryId') queueEntryId: string,
    @Body() dto: SkipQueueEntryDto,
  ) {
    return this.queue.skip(user, queueEntryId, dto.reason);
  }

  @Post('queue/:queueEntryId/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start the consultation for a called patient' })
  start(@CurrentUser() user: AuthenticatedUser, @Param('queueEntryId') queueEntryId: string) {
    return this.queue.start(user, queueEntryId);
  }

  @Post('queue/:queueEntryId/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete the consultation for a queued patient' })
  complete(@CurrentUser() user: AuthenticatedUser, @Param('queueEntryId') queueEntryId: string) {
    return this.queue.complete(user, queueEntryId);
  }
}
