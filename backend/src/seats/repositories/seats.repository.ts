import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seat } from '../../entities/seat.entity';
import { Reservation, ReservationStatus } from '../../entities/reservation.entity';
import { ISeatsRepository } from '../interfaces/seats-repository.interface';

@Injectable()
export class SeatsRepository implements ISeatsRepository {
  constructor(
    @InjectRepository(Seat)
    private readonly seatRepo: Repository<Seat>,
    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,
  ) {}

  count(): Promise<number> {
    return this.seatRepo.count();
  }

  async seed(seats: { number: number; label: string }[]): Promise<void> {
    await this.seatRepo.save(seats);
  }

  findAllOrdered(): Promise<Seat[]> {
    return this.seatRepo.find({ order: { number: 'ASC' } });
  }

  async expireStaleForSeat(seatId: string, now: Date): Promise<void> {
    await this.reservationRepo
      .createQueryBuilder()
      .update(Reservation)
      .set({ status: ReservationStatus.CANCELLED })
      .where('seatId = :seatId', { seatId })
      .andWhere('status = :status', { status: ReservationStatus.PENDING })
      .andWhere('expiresAt <= :now', { now })
      .execute();
  }

  findActiveReservationForSeat(seatId: string): Promise<Reservation | null> {
    return this.reservationRepo.findOne({
      where: [
        { seatId, status: ReservationStatus.CONFIRMED },
        { seatId, status: ReservationStatus.PENDING },
      ],
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }
}
