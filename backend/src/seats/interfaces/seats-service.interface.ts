import { Seat } from '../../entities/seat.entity';

export interface SeatWithStatus extends Omit<Seat, 'reservations'> {
  isAvailable: boolean;
  reservation: {
    id: string;
    status: string;
    expiresAt: Date;
    userEmail?: string;
  } | null;
}

export interface ISeatsService {
  findAllWithStatus(): Promise<SeatWithStatus[]>;
}
