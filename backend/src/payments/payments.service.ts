import * as crypto from 'crypto';
import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import appConfig from '../config/app.config';
import paymentConfig from '../config/payment.config';
import { Reservation, ReservationStatus } from '../entities/reservation.entity';
import { WebhookEventType } from '../webhooks/dto/payment-webhook.dto';
import { PAYMENTS_REPOSITORY } from './payments.constants';
import { IPaymentsRepository } from './interfaces/payments-repository.interface';
import { IPaymentsService, InitiatePaymentResult } from './interfaces/payments-service.interface';
import { ProcessPaymentDto } from './dto/process-payment.dto';

@Injectable()
export class PaymentsService implements IPaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @Inject(PAYMENTS_REPOSITORY)
    private readonly paymentsRepo: IPaymentsRepository,
    @Inject(paymentConfig.KEY)
    private readonly paymentConf: ConfigType<typeof paymentConfig>,
    @Inject(appConfig.KEY)
    private readonly appConf: ConfigType<typeof appConfig>,
    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,
  ) {}

  async initiate(userId: string, reservationId: string, dto: ProcessPaymentDto): Promise<InitiatePaymentResult> {
    const reservation = await this.reservationRepo.findOne({ where: { id: reservationId } });

    if (!reservation) throw new NotFoundException('Reservation not found');
    if (reservation.userId !== userId) throw new BadRequestException('Access denied');
    if (reservation.status !== ReservationStatus.PENDING) {
      throw new BadRequestException(`Reservation is already ${reservation.status}`);
    }
    if (reservation.expiresAt < new Date()) {
      await this.reservationRepo.update(reservationId, { status: ReservationStatus.CANCELLED });
      throw new BadRequestException('Reservation has expired. Please select a seat again.');
    }

    const success = !dto.cardNumber.replace(/\s/g, '').endsWith('0000');
    const payment = await this.paymentsRepo.createPending(reservationId, this.paymentConf.seatPrice);

    // Simulate the payment provider calling back asynchronously
    const payload = {
      eventId: uuidv4(),
      type: success ? WebhookEventType.PAYMENT_COMPLETED : WebhookEventType.PAYMENT_FAILED,
      reservationId,
      transactionId: success ? `TXN-${uuidv4().slice(0, 8).toUpperCase()}` : undefined,
      amount: this.paymentConf.seatPrice,
      timestamp: new Date().toISOString(),
    };

    setTimeout(() => {
      this.dispatchWebhook(payload).catch((err) =>
        this.logger.error(`Webhook dispatch failed for event ${payload.eventId}`, err),
      );
    }, 300);

    return { status: 'processing', reservationId, paymentId: payment.id };
  }

  private async dispatchWebhook(payload: object): Promise<void> {
    const body = JSON.stringify(payload);
    const signature = `sha256=${crypto
      .createHmac('sha256', this.paymentConf.webhookSecret)
      .update(body)
      .digest('hex')}`;

    const url = `http://localhost:${this.appConf.port}/api/webhooks/payment`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Payment-Signature': signature },
      body,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Webhook responded ${res.status}: ${text}`);
    }

    this.logger.log(`Webhook dispatched for ${(payload as any).eventId}`);
  }
}
