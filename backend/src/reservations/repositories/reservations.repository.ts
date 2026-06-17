import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Reservation, ReservationStatus } from '../../entities/reservation.entity';
import { Seat } from '../../entities/seat.entity';
import { IReservationsRepository } from '../interfaces/reservations-repository.interface';

@Injectable()
export class ReservationsRepository implements IReservationsRepository {
  constructor(
    @InjectRepository(Reservation)
    private readonly repo: Repository<Reservation>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  findById(id: string): Promise<Reservation | null> {
    return this.repo.findOne({ where: { id }, relations: ['seat', 'user', 'payment'] });
  }

  findByUser(userId: string): Promise<Reservation[]> {
    return this.repo.find({
      where: { userId },
      relations: ['seat', 'payment'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(id: string, status: ReservationStatus): Promise<void> {
    await this.repo.update(id, { status });
  }

  async createPendingAtomic(userId: string, seatId: string, expiresAt: Date): Promise<Reservation> {
    return this.dataSource.transaction(async (manager) => {
      const seat = await manager.findOne(Seat, {
        where: { id: seatId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!seat) throw new NotFoundException('Seat not found');

      const now = new Date();
      const conflict = await manager
        .createQueryBuilder(Reservation, 'r')
        .where('r.seatId = :seatId', { seatId })
        .andWhere(
          '(r.status = :confirmed OR (r.status = :pending AND r.expiresAt > :now))',
          { confirmed: ReservationStatus.CONFIRMED, pending: ReservationStatus.PENDING, now },
        )
        .getOne();
      if (conflict) throw new ConflictException('Seat is no longer available');

      await manager.update(
        Reservation,
        { userId, status: ReservationStatus.PENDING },
        { status: ReservationStatus.CANCELLED },
      );

      return manager.save(
        manager.create(Reservation, {
          userId,
          seatId: seat.id,
          status: ReservationStatus.PENDING,
          expiresAt,
        }),
      );
    });
  }
}
