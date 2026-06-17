import { Body, Controller, Inject, Post } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { WEBHOOKS_SERVICE } from './webhooks.constants';
import { IWebhooksService } from './interfaces/webhooks-service.interface';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    @Inject(WEBHOOKS_SERVICE)
    private readonly webhooksService: IWebhooksService,
  ) {}

  @Public()
  @Post('payment')
  handlePayment(@Body() dto: PaymentWebhookDto) {
    return this.webhooksService.handlePaymentEvent(dto);
  }
}
