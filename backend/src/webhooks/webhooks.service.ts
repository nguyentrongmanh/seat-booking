import { Inject, Injectable, Logger } from '@nestjs/common';
import { WEBHOOKS_REPOSITORY } from './webhooks.constants';
import { IWebhooksRepository } from './interfaces/webhooks-repository.interface';
import { IWebhooksService } from './interfaces/webhooks-service.interface';
import { PaymentWebhookDto } from './dto/payment-webhook.dto';

@Injectable()
export class WebhooksService implements IWebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @Inject(WEBHOOKS_REPOSITORY)
    private readonly webhooksRepo: IWebhooksRepository,
  ) {}

  async handlePaymentEvent(dto: PaymentWebhookDto): Promise<{ message: string }> {
    const { alreadyProcessed } = await this.webhooksRepo.processPaymentEvent(dto);

    if (alreadyProcessed) {
      return { message: 'already processed' };
    }

    this.logger.log(`Webhook ${dto.eventId} (${dto.type}) processed for reservation ${dto.reservationId}`);
    return { message: 'processed' };
  }
}
