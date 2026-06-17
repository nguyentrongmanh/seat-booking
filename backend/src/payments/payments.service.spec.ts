import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PAYMENTS_REPOSITORY } from './payments.constants';
import { IPaymentsRepository } from './interfaces/payments-repository.interface';
import { Reservation, ReservationStatus } from '../entities/reservation.entity';
import { Payment, PaymentStatus } from '../entities/payment.entity';
import paymentConfig from '../config/payment.config';
import appConfig from '../config/app.config';

const buildReservation = (overrides: Partial<Reservation> = {}): Reservation =>
  ({
    id: 'res-1',
    userId: 'user-1',
    seatId: 'seat-1',
    status: ReservationStatus.PENDING,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    ...overrides,
  } as Reservation);

describe('PaymentsService', () => {
  let service: PaymentsService;
  let paymentsRepo: jest.Mocked<IPaymentsRepository>;
  let reservationRepo: { findOne: jest.Mock; update: jest.Mock };

  const mockPaymentConfig = { seatPrice: 50, pendingExpiryMinutes: 15, webhookSecret: 'test-secret' };
  const mockAppConfig = { port: 5000, nodeEnv: 'test', frontendUrl: 'http://localhost:3000' };

  const validDto = {
    cardNumber: '4111 1111 1111 1234',
    expiry: '12/27',
    cvv: '123',
    cardholderName: 'John Doe',
  };

  beforeEach(async () => {
    const mockPaymentsRepo: jest.Mocked<IPaymentsRepository> = {
      createPending: jest.fn(),
    };
    const mockReservationRepo = { findOne: jest.fn(), update: jest.fn() };

    // Prevent the real fetch from firing during unit tests
    jest.spyOn(global, 'setTimeout').mockImplementation((fn: any) => { void fn; return 0 as any; });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PAYMENTS_REPOSITORY, useValue: mockPaymentsRepo },
        { provide: paymentConfig.KEY, useValue: mockPaymentConfig },
        { provide: appConfig.KEY, useValue: mockAppConfig },
        { provide: getRepositoryToken(Reservation), useValue: mockReservationRepo },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    paymentsRepo = module.get(PAYMENTS_REPOSITORY);
    reservationRepo = module.get(getRepositoryToken(Reservation));
  });

  afterEach(() => jest.restoreAllMocks());

  describe('initiate', () => {
    it('throws NotFoundException when reservation does not exist', async () => {
      reservationRepo.findOne.mockResolvedValue(null);
      await expect(service.initiate('user-1', 'res-1', validDto)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when userId does not match reservation owner', async () => {
      reservationRepo.findOne.mockResolvedValue(buildReservation({ userId: 'other' }));
      await expect(service.initiate('user-1', 'res-1', validDto)).rejects.toThrow(
        expect.objectContaining({ message: 'Access denied' }),
      );
    });

    it('throws BadRequestException when reservation is already confirmed', async () => {
      reservationRepo.findOne.mockResolvedValue(
        buildReservation({ status: ReservationStatus.CONFIRMED }),
      );
      await expect(service.initiate('user-1', 'res-1', validDto)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when reservation is already cancelled', async () => {
      reservationRepo.findOne.mockResolvedValue(
        buildReservation({ status: ReservationStatus.CANCELLED }),
      );
      await expect(service.initiate('user-1', 'res-1', validDto)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException and cancels when reservation is expired', async () => {
      reservationRepo.findOne.mockResolvedValue(
        buildReservation({ expiresAt: new Date(Date.now() - 1000) }),
      );
      reservationRepo.update.mockResolvedValue(undefined);

      await expect(service.initiate('user-1', 'res-1', validDto)).rejects.toThrow(
        expect.objectContaining({ message: expect.stringMatching(/expired/i) }),
      );
      expect(reservationRepo.update).toHaveBeenCalledWith('res-1', {
        status: ReservationStatus.CANCELLED,
      });
    });

    it('creates a pending payment and returns processing status', async () => {
      reservationRepo.findOne.mockResolvedValue(buildReservation());
      paymentsRepo.createPending.mockResolvedValue({ id: 'pay-1', status: PaymentStatus.PENDING } as Payment);

      const result = await service.initiate('user-1', 'res-1', validDto);

      expect(paymentsRepo.createPending).toHaveBeenCalledWith('res-1', 50);
      expect(result).toEqual({ status: 'processing', reservationId: 'res-1', paymentId: 'pay-1' });
    });

    it('schedules a webhook dispatch with success=completed for card NOT ending in 0000', async () => {
      reservationRepo.findOne.mockResolvedValue(buildReservation());
      paymentsRepo.createPending.mockResolvedValue({ id: 'pay-1' } as Payment);

      const setTimeoutSpy = jest.spyOn(global, 'setTimeout') as jest.MockedFunction<typeof setTimeout>;
      setTimeoutSpy.mockImplementation((fn: any) => { void fn; return 0 as any; });

      await service.initiate('user-1', 'res-1', { ...validDto, cardNumber: '4111 1111 1111 1234' });

      const [callback] = setTimeoutSpy.mock.calls[0];
      const dispatchSpy = jest.spyOn(service as any, 'dispatchWebhook').mockResolvedValue(undefined);
      (callback as () => void)();
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'payment.completed' }),
      );
    });

    it('schedules a webhook dispatch with failed for card ending in 0000', async () => {
      reservationRepo.findOne.mockResolvedValue(buildReservation());
      paymentsRepo.createPending.mockResolvedValue({ id: 'pay-1' } as Payment);

      const setTimeoutSpy = jest.spyOn(global, 'setTimeout') as jest.MockedFunction<typeof setTimeout>;
      setTimeoutSpy.mockImplementation((fn: any) => { void fn; return 0 as any; });

      await service.initiate('user-1', 'res-1', { ...validDto, cardNumber: '4111 1111 1111 0000' });

      const [callback] = setTimeoutSpy.mock.calls[0];
      const dispatchSpy = jest.spyOn(service as any, 'dispatchWebhook').mockResolvedValue(undefined);
      (callback as () => void)();
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'payment.failed' }),
      );
    });

    it('strips spaces before checking if card ends in 0000', async () => {
      reservationRepo.findOne.mockResolvedValue(buildReservation());
      paymentsRepo.createPending.mockResolvedValue({ id: 'pay-1' } as Payment);

      const setTimeoutSpy = jest.spyOn(global, 'setTimeout') as jest.MockedFunction<typeof setTimeout>;
      setTimeoutSpy.mockImplementation((fn: any) => { void fn; return 0 as any; });

      await service.initiate('user-1', 'res-1', { ...validDto, cardNumber: '4111111111110000' });

      const [callback] = setTimeoutSpy.mock.calls[0];
      const dispatchSpy = jest.spyOn(service as any, 'dispatchWebhook').mockResolvedValue(undefined);
      (callback as () => void)();
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'payment.failed' }),
      );
    });
  });
});
