import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import appConfig from '../../src/config/app.config';
import authConfig from '../../src/config/auth.config';
import paymentConfig from '../../src/config/payment.config';
import { User } from '../../src/entities/user.entity';
import { Seat } from '../../src/entities/seat.entity';
import { Reservation } from '../../src/entities/reservation.entity';
import { Payment } from '../../src/entities/payment.entity';
import { WebhookEvent } from '../../src/entities/webhook-event.entity';
import { UsersModule } from '../../src/users/users.module';
import { AuthModule } from '../../src/auth/auth.module';
import { SeatsModule } from '../../src/seats/seats.module';
import { ReservationsModule } from '../../src/reservations/reservations.module';
import { PaymentsModule } from '../../src/payments/payments.module';
import { WebhooksModule } from '../../src/webhooks/webhooks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, paymentConfig],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.TEST_DB_HOST || 'localhost',
      port: Number(process.env.TEST_DB_PORT) || 5432,
      username: process.env.TEST_DB_USER || 'postgres',
      password: process.env.TEST_DB_PASSWORD || 'postgres',
      database: process.env.TEST_DB_NAME || 'seat_reservation_test',
      entities: [User, Seat, Reservation, Payment, WebhookEvent],
      synchronize: true,
      dropSchema: true,
      logging: false,
    }),
    UsersModule,
    AuthModule,
    SeatsModule,
    ReservationsModule,
    PaymentsModule,
    WebhooksModule,
  ],
})
export class TestAppModule {}
