import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ReservationStatus } from '../entities/reservation.entity';
import { SEATS_REPOSITORY } from './seats.constants';
import { ISeatsRepository } from './interfaces/seats-repository.interface';
import { ISeatsService, SeatWithStatus } from './interfaces/seats-service.interface';

@Injectable()
export class SeatsService implements ISeatsService, OnModuleInit {
  constructor(
    @Inject(SEATS_REPOSITORY)
    private readonly seatsRepo: ISeatsRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.seatsRepo.count();
    if (count === 0) {
      await this.seatsRepo.seed([
        { number: 1, label: 'Seat A1' },
        { number: 2, label: 'Seat B1' },
        { number: 3, label: 'Seat C1' },
      ]);
    }
  }

  async findAllWithStatus(): Promise<SeatWithStatus[]> {
    const seats = await this.seatsRepo.findAllOrdered();
    const now = new Date();

    return Promise.all(
      seats.map(async (seat) => {
        await this.seatsRepo.expireStaleForSeat(seat.id, now);

        const active = await this.seatsRepo.findActiveReservationForSeat(seat.id);

        return {
          ...seat,
          isAvailable: !active,
          reservation: active
            ? {
                id: active.id,
                status: active.status,
                expiresAt: active.expiresAt,
                userEmail:
                  active.status === ReservationStatus.CONFIRMED
                    ? active.user?.email
                    : undefined,
              }
            : null,
        };
      }),
    );
  }
}
