import { Body, Controller, Inject, Param, Post } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';
import { PAYMENTS_SERVICE } from './payments.constants';
import { IPaymentsService } from './interfaces/payments-service.interface';
import { ProcessPaymentDto } from './dto/process-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(
    @Inject(PAYMENTS_SERVICE)
    private readonly paymentsService: IPaymentsService,
  ) {}

  @Post('initiate/:reservationId')
  initiate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reservationId', ParseUUIDPipe) reservationId: string,
    @Body() dto: ProcessPaymentDto,
  ) {
    return this.paymentsService.initiate(user.id, reservationId, dto);
  }
}
