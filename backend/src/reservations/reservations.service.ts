import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import paymentConfig from '../config/payment.config';
import { Reservation } from '../entities/reservation.entity';
import { minutesFromNow } from '../common/utils/date.util';
import { RESERVATIONS_REPOSITORY } from './reservations.constants';
import { IReservationsRepository } from './interfaces/reservations-repository.interface';
import { IReservationsService } from './interfaces/reservations-service.interface';
import { CreateReservationDto } from './dto/create-reservation.dto';

@Injectable()
export class ReservationsService implements IReservationsService {
  constructor(
    @Inject(RESERVATIONS_REPOSITORY)
    private readonly reservationsRepo: IReservationsRepository,
    @Inject(paymentConfig.KEY)
    private readonly paymentConf: ConfigType<typeof paymentConfig>,
  ) {}

  async create(userId: string, dto: CreateReservationDto): Promise<Reservation> {
    const expiresAt = minutesFromNow(this.paymentConf.pendingExpiryMinutes);
    return this.reservationsRepo.createPendingAtomic(userId, dto.seatId, expiresAt);
  }

  findById(id: string): Promise<Reservation | null> {
    return this.reservationsRepo.findById(id);
  }

  findByUser(userId: string): Promise<Reservation[]> {
    return this.reservationsRepo.findByUser(userId);
  }
}
