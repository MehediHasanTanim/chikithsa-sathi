import { Body, Controller, Get, Headers, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@modules/auth/auth.types';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ListPaymentsQueryDto } from './dto/list-payments.query.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('payments')
  @ApiHeader({ name: 'Idempotency-Key', required: false })
  @ApiOperation({ summary: 'Record a payment and issue a receipt' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePaymentDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.payments.create(user, dto, idempotencyKey);
  }

  @Get('payments')
  @ApiOperation({ summary: 'List payments for a chamber' })
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListPaymentsQueryDto) {
    return this.payments.list(user, query);
  }

  @Get('payments/:paymentId')
  @ApiOperation({ summary: 'Get a payment' })
  getById(@CurrentUser() user: AuthenticatedUser, @Param('paymentId') paymentId: string) {
    return this.payments.getById(user, paymentId);
  }

  @Get('payments/:paymentId/receipt')
  @ApiOperation({ summary: 'Get a payment receipt' })
  receipt(@CurrentUser() user: AuthenticatedUser, @Param('paymentId') paymentId: string) {
    return this.payments.receipt(user, paymentId);
  }

  @Post('payments/:paymentId/refund')
  @ApiOperation({ summary: 'Refund a payment' })
  refund(
    @CurrentUser() user: AuthenticatedUser,
    @Param('paymentId') paymentId: string,
    @Body() dto: RefundPaymentDto,
  ) {
    return this.payments.refund(user, paymentId, dto);
  }
}
