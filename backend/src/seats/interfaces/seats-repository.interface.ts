import { Seat } from '../../entities/seat.entity';
import { Reservation } from '../../entities/reservation.entity';

export interface ISeatsRepository {
  count(): Promise<number>;
  seed(seats: { number: number; label: string }[]): Promise<void>;
  findAllOrdered(): Promise<Seat[]>;
  expireStaleForSeat(seatId: string, now: Date): Promise<void>;
  findActiveReservationForSeat(seatId: string): Promise<Reservation | null>;
}
