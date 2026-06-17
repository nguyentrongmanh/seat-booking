import { IsEnum, IsISO8601, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export enum WebhookEventType {
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
}

export class PaymentWebhookDto {
  @IsString()
  eventId: string;

  @IsEnum(WebhookEventType)
  type: WebhookEventType;

  @IsUUID()
  reservationId: string;

  @IsString()
  @IsOptional()
  transactionId?: string;

  @IsNumber()
  amount: number;

  @IsISO8601()
  timestamp: string;
}
