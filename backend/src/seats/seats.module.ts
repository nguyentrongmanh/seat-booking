import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Seat } from '../entities/seat.entity';
import { Reservation } from '../entities/reservation.entity';
import { SeatsRepository } from './repositories/seats.repository';
import { SeatsService } from './seats.service';
import { SeatsController } from './seats.controller';
import { SEATS_REPOSITORY, SEATS_SERVICE } from './seats.constants';

@Module({
  imports: [TypeOrmModule.forFeature([Seat, Reservation])],
  controllers: [SeatsController],
  providers: [
    { provide: SEATS_REPOSITORY, useClass: SeatsRepository },
    { provide: SEATS_SERVICE, useClass: SeatsService },
  ],
  exports: [SEATS_SERVICE],
})
export class SeatsModule {}
