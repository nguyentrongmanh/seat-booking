import { Reservation } from '../../entities/reservation.entity';
import { CreateReservationDto } from '../dto/create-reservation.dto';

export interface IReservationsService {
  create(userId: string, dto: CreateReservationDto): Promise<Reservation>;
  findById(id: string): Promise<Reservation | null>;
  findByUser(userId: string): Promise<Reservation[]>;
}
