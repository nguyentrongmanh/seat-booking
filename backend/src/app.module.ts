import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';

import appConfig from './config/app.config';
import authConfig from './config/auth.config';
import databaseConfig from './config/database.config';
import paymentConfig from './config/payment.config';

import { User } from './entities/user.entity';
import { Seat } from './entities/seat.entity';
import { Reservation } from './entities/reservation.entity';
import { Payment } from './entities/payment.entity';
import { WebhookEvent } from './entities/webhook-event.entity';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { SeatsModule } from './seats/seats.module';
import { ReservationsModule } from './reservations/reservations.module';
import { PaymentsModule } from './payments/payments.module';
import { HealthModule } from './health/health.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, databaseConfig, paymentConfig],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (dbConfig: ConfigType<typeof databaseConfig>) => ({
        type: 'postgres',
        host: dbConfig.host,
        port: dbConfig.port,
        username: dbConfig.username,
        password: dbConfig.password,
        database: dbConfig.database,
        entities: [User, Seat, Reservation, Payment, WebhookEvent],
        migrations: [join(__dirname, 'migration', '*.js')],
        migrationsRun: true,
        synchronize: false,
        logging: process.env.NODE_ENV === 'development',
      }),
      inject: [databaseConfig.KEY],
    }),
    UsersModule,
    AuthModule,
    SeatsModule,
    ReservationsModule,
    PaymentsModule,
    HealthModule,
    WebhooksModule,
  ],
})
export class AppModule {}
