import { PaymentWebhookDto } from '../dto/payment-webhook.dto';

export interface IWebhooksService {
  handlePaymentEvent(dto: PaymentWebhookDto): Promise<{ message: string }>;
}
