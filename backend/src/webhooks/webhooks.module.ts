import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookEvent } from '../entities/webhook-event.entity';
import { Reservation } from '../entities/reservation.entity';
import { Payment } from '../entities/payment.entity';
import { WebhooksRepository } from './repositories/webhooks.repository';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { WebhookSignatureMiddleware } from './middlewares/webhook-signature.middleware';
import { WEBHOOKS_REPOSITORY, WEBHOOKS_SERVICE } from './webhooks.constants';

@Module({
  imports: [TypeOrmModule.forFeature([WebhookEvent, Reservation, Payment])],
  controllers: [WebhooksController],
  providers: [
    { provide: WEBHOOKS_REPOSITORY, useClass: WebhooksRepository },
    { provide: WEBHOOKS_SERVICE, useClass: WebhooksService },
  ],
})
export class WebhooksModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(WebhookSignatureMiddleware)
      .forRoutes({ path: 'webhooks/payment', method: RequestMethod.POST });
  }
}
