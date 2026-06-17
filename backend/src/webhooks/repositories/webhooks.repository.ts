import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryFailedError } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { WebhookEvent, WebhookEventStatus } from '../../entities/webhook-event.entity';
import { Payment, PaymentStatus } from '../../entities/payment.entity';
import { Reservation, ReservationStatus } from '../../entities/reservation.entity';
import { PaymentWebhookDto, WebhookEventType } from '../dto/payment-webhook.dto';
import { IWebhooksRepository, WebhookProcessResult } from '../interfaces/webhooks-repository.interface';

const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class WebhooksRepository implements IWebhooksRepository {
  private readonly logger = new Logger(WebhooksRepository.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async processPaymentEvent(dto: PaymentWebhookDto): Promise<WebhookProcessResult> {
    const isSuccess = dto.type === WebhookEventType.PAYMENT_COMPLETED;

    try {
      await this.dataSource.transaction(async (manager) => {
        // Insert webhook event — unique constraint on eventId is the idempotency gate.
        // A concurrent duplicate delivery will fail here with a unique violation.
        await manager.save(
          manager.create(WebhookEvent, {
            eventId: dto.eventId,
            type: dto.type,
            payload: dto as unknown as object,
            status: isSuccess ? WebhookEventStatus.PAID : WebhookEventStatus.FAILED,
          }),
        );

        const reservation = await manager.findOne(Reservation, {
          where: { id: dto.reservationId },
        });

        if (!reservation || reservation.status !== ReservationStatus.PENDING) {
          this.logger.warn(
            `Webhook ${dto.eventId}: reservation ${dto.reservationId} not in pending state — skipping`,
          );
          await manager.update(WebhookEvent, { eventId: dto.eventId }, { status: WebhookEventStatus.SKIPPED });
          return;
        }

        await manager.update(Reservation, dto.reservationId, {
          status: isSuccess ? ReservationStatus.CONFIRMED : ReservationStatus.CANCELLED,
        });

        // Upsert payment record — may already exist from the direct payment flow
        const existing = await manager.findOne(Payment, { where: { reservationId: dto.reservationId } });
        if (existing) {
          await manager.update(Payment, existing.id, {
            status: isSuccess ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
            transactionId: dto.transactionId ?? existing.transactionId,
          });
        } else {
          await manager.save(
            manager.create(Payment, {
              reservationId: dto.reservationId,
              amount: dto.amount,
              status: isSuccess ? PaymentStatus.COMPLETED : PaymentStatus.FAILED,
              transactionId: dto.transactionId ?? `TXN-${uuidv4().slice(0, 8).toUpperCase()}`,
            }),
          );
        }
      });

      return { alreadyProcessed: false };
    } catch (err) {
      if (err instanceof QueryFailedError && (err as any).driverError?.code === PG_UNIQUE_VIOLATION) {
        this.logger.log(`Webhook ${dto.eventId} already processed — ignoring duplicate delivery`);
        return { alreadyProcessed: true };
      }
      throw err;
    }
  }
}
