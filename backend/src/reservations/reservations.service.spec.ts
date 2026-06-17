import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { RESERVATIONS_REPOSITORY } from './reservations.constants';
import { IReservationsRepository } from './interfaces/reservations-repository.interface';
import { Reservation, ReservationStatus } from '../entities/reservation.entity';
import paymentConfig from '../config/payment.config';

describe('ReservationsService', () => {
  let service: ReservationsService;
  let repo: jest.Mocked<IReservationsRepository>;

  const mockPaymentConfig = { seatPrice: 50, pendingExpiryMinutes: 15, webhookSecret: 'test' };

  beforeEach(async () => {
    const mockRepo: jest.Mocked<IReservationsRepository> = {
      findById: jest.fn(),
      findByUser: jest.fn(),
      updateStatus: jest.fn(),
      createPendingAtomic: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        { provide: RESERVATIONS_REPOSITORY, useValue: mockRepo },
        { provide: paymentConfig.KEY, useValue: mockPaymentConfig },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
    repo = module.get(RESERVATIONS_REPOSITORY);
  });

  describe('create', () => {
    it('delegates to createPendingAtomic with the correct userId and seatId', async () => {
      const userId = 'user-uuid';
      const seatId = 'seat-uuid';
      const expected = { id: 'res-uuid', userId, seatId, status: ReservationStatus.PENDING } as Reservation;
      repo.createPendingAtomic.mockResolvedValue(expected);

      const result = await service.create(userId, { seatId });

      expect(repo.createPendingAtomic).toHaveBeenCalledWith(userId, seatId, expect.any(Date));
      expect(result).toBe(expected);
    });

    it('computes expiresAt as pendingExpiryMinutes minutes from now', async () => {
      repo.createPendingAtomic.mockResolvedValue({} as Reservation);
      const before = Date.now();

      await service.create('u', { seatId: 's' });

      const expiresAt: Date = repo.createPendingAtomic.mock.calls[0][2];
      const diff = expiresAt.getTime() - before;
      const expectedMs = 15 * 60 * 1000;
      expect(diff).toBeGreaterThanOrEqual(expectedMs - 50);
      expect(diff).toBeLessThanOrEqual(expectedMs + 50);
    });

    it('propagates ConflictException from repository when seat is taken', async () => {
      repo.createPendingAtomic.mockRejectedValue(new ConflictException('Seat is no longer available'));
      await expect(service.create('u', { seatId: 's' })).rejects.toThrow(ConflictException);
    });

    it('propagates NotFoundException from repository when seat does not exist', async () => {
      repo.createPendingAtomic.mockRejectedValue(new NotFoundException('Seat not found'));
      await expect(service.create('u', { seatId: 'nonexistent' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('delegates to repository and returns the reservation', async () => {
      const res = { id: 'res-1' } as Reservation;
      repo.findById.mockResolvedValue(res);

      expect(await service.findById('res-1')).toBe(res);
      expect(repo.findById).toHaveBeenCalledWith('res-1');
    });

    it('returns null when the reservation does not exist', async () => {
      repo.findById.mockResolvedValue(null);
      expect(await service.findById('nonexistent')).toBeNull();
    });
  });

  describe('findByUser', () => {
    it('delegates to repository and returns all reservations for the user', async () => {
      const list = [{ id: 'r1' }, { id: 'r2' }] as Reservation[];
      repo.findByUser.mockResolvedValue(list);

      expect(await service.findByUser('user-1')).toBe(list);
      expect(repo.findByUser).toHaveBeenCalledWith('user-1');
    });

    it('returns an empty array when the user has no reservations', async () => {
      repo.findByUser.mockResolvedValue([]);
      expect(await service.findByUser('user-new')).toEqual([]);
    });
  });
});
