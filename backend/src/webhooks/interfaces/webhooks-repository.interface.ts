import { PaymentWebhookDto } from '../dto/payment-webhook.dto';

export interface WebhookProcessResult {
  alreadyProcessed: boolean;
}

export interface IWebhooksRepository {
  processPaymentEvent(dto: PaymentWebhookDto): Promise<WebhookProcessResult>;
}
