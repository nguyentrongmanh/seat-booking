import { Reservation, ReservationStatus } from '../../entities/reservation.entity';

export interface IReservationsRepository {
  findById(id: string): Promise<Reservation | null>;
  findByUser(userId: string): Promise<Reservation[]>;
  updateStatus(id: string, status: ReservationStatus): Promise<void>;
  createPendingAtomic(userId: string, seatId: string, expiresAt: Date): Promise<Reservation>;
}
