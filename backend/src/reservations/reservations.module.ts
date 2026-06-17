import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from '../entities/reservation.entity';
import { Seat } from '../entities/seat.entity';
import { ReservationsRepository } from './repositories/reservations.repository';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { RESERVATIONS_REPOSITORY, RESERVATIONS_SERVICE } from './reservations.constants';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation, Seat])],
  controllers: [ReservationsController],
  providers: [
    { provide: RESERVATIONS_REPOSITORY, useClass: ReservationsRepository },
    { provide: RESERVATIONS_SERVICE, useClass: ReservationsService },
  ],
  exports: [RESERVATIONS_SERVICE],
})
export class ReservationsModule {}
