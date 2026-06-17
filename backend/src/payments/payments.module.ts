import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../entities/payment.entity';
import { Reservation } from '../entities/reservation.entity';
import { PaymentsRepository } from './repositories/payments.repository';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PAYMENTS_REPOSITORY, PAYMENTS_SERVICE } from './payments.constants';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Reservation])],
  controllers: [PaymentsController],
  providers: [
    { provide: PAYMENTS_REPOSITORY, useClass: PaymentsRepository },
    { provide: PAYMENTS_SERVICE, useClass: PaymentsService },
  ],
})
export class PaymentsModule {}
