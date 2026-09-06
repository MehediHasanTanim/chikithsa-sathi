import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { HealthService } from './health.service';

@ApiTags('Health')
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Check application and required infrastructure health' })
  health() {
    return this.healthService.health();
  }

  @Get('live')
  @ApiOperation({ summary: 'Check that the application process is live' })
  live() {
    return this.healthService.live();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Check that required infrastructure is ready' })
  ready() {
    return this.healthService.ready();
  }
}
