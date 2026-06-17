import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp } from './helpers/create-test-app';

describe('Integration', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    app = await createTestApp();
    dataSource = app.get(DataSource);
  }, 60000);

  beforeEach(async () => {
    await dataSource.query('DELETE FROM webhook_events');
    await dataSource.query('DELETE FROM payments');
    await dataSource.query('DELETE FROM reservations');
    await dataSource.query('DELETE FROM users');
  });

  afterAll(async () => {
    await app.close();
  });

  // ── helpers ────────────────────────────────────────────────────────────────

  const registerAndLogin = async (email: string, name = 'Test User', password = 'Password1!') => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, name, password })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(201);

    return res.body.data.token as string;
  };

  const getFirstAvailableSeat = async () => {
    const res = await request(app.getHttpServer()).get('/api/seats').expect(200);
    return res.body.data.find((s: any) => s.isAvailable) as { id: string; label: string };
  };

  const createReservation = async (token: string, seatId: string) => {
    const res = await request(app.getHttpServer())
      .post('/api/reservations')
      .set('Authorization', `Bearer ${token}`)
      .send({ seatId })
      .expect(201);
    return res.body.data as { id: string; status: string; seatId: string };
  };

  const initiatePayment = async (token: string, reservationId: string, cardNumber: string) => {
    const res = await request(app.getHttpServer())
      .post(`/api/payments/initiate/${reservationId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ cardNumber, expiry: '12/27', cvv: '123', cardholderName: 'Test User' })
      .expect(201);
    return res.body.data as { status: string; reservationId: string; paymentId: string };
  };

  const waitForReservationStatus = async (
    token: string,
    reservationId: string,
    maxWaitMs = 3000,
  ): Promise<{ status: string; payment: any }> => {
    const deadline = Date.now() + maxWaitMs;
    while (Date.now() < deadline) {
      const res = await request(app.getHttpServer())
        .get(`/api/reservations/${reservationId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      const data = res.body.data;
      if (data.status !== 'pending') return data;
      await new Promise((r) => setTimeout(r, 150));
    }
    throw new Error(`Reservation ${reservationId} still pending after ${maxWaitMs}ms`);
  };

  // ── Reserve Seat ───────────────────────────────────────────────────────────

  describe('Reserve Seat', () => {
    it('creates a pending reservation for an authenticated user', async () => {
      const token = await registerAndLogin('reserve@test.com');
      const seat = await getFirstAvailableSeat();

      const res = await request(app.getHttpServer())
        .post('/api/reservations')
        .set('Authorization', `Bearer ${token}`)
        .send({ seatId: seat.id })
        .expect(201);

      expect(res.body.data).toMatchObject({ seatId: seat.id, status: 'pending' });
      expect(new Date(res.body.data.expiresAt).getTime()).toBeGreaterThan(Date.now());
    });

    it('returns 401 when no auth token is provided', async () => {
      const seat = await getFirstAvailableSeat();
      await request(app.getHttpServer())
        .post('/api/reservations')
        .send({ seatId: seat.id })
        .expect(401);
    });
  });

  // ── Double Booking ─────────────────────────────────────────────────────────

  describe('Double Booking', () => {
    it('returns 409 when seat already has an active reservation', async () => {
      const token1 = await registerAndLogin('user1@test.com');
      const token2 = await registerAndLogin('user2@test.com');
      const seat = await getFirstAvailableSeat();

      await createReservation(token1, seat.id);

      const res = await request(app.getHttpServer())
        .post('/api/reservations')
        .set('Authorization', `Bearer ${token2}`)
        .send({ seatId: seat.id })
        .expect(409);

      expect(res.body.message).toMatch(/no longer available/i);
    });

    it("cancels a user's existing pending reservation when they switch to a new seat", async () => {
      const token = await registerAndLogin('switcher@test.com');
      const seats = await request(app.getHttpServer()).get('/api/seats').expect(200);
      const [seat1, seat2] = seats.body.data;

      const first = await createReservation(token, seat1.id);
      const second = await createReservation(token, seat2.id);

      expect(second.seatId).toBe(seat2.id);

      const firstRefresh = await request(app.getHttpServer())
        .get(`/api/reservations/${first.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(firstRefresh.body.data.status).toBe('cancelled');
    });
  });

  // ── Payment Success ────────────────────────────────────────────────────────

  describe('Payment Success', () => {
    it('confirms reservation via webhook callback when card does not end in 0000', async () => {
      const token = await registerAndLogin('success@test.com');
      const seat = await getFirstAvailableSeat();
      const reservation = await createReservation(token, seat.id);

      const initiated = await initiatePayment(token, reservation.id, '4111 1111 1111 1234');

      expect(initiated.status).toBe('processing');
      expect(initiated.paymentId).toBeDefined();

      const final = await waitForReservationStatus(token, reservation.id);

      expect(final.status).toBe('confirmed');
      expect(final.payment.status).toBe('completed');
      expect(final.payment.transactionId).toMatch(/^TXN-/);
    });
  });

  // ── Payment Failure ────────────────────────────────────────────────────────

  describe('Payment Failure', () => {
    it('cancels reservation via webhook callback when card ends in 0000', async () => {
      const token = await registerAndLogin('failure@test.com');
      const seat = await getFirstAvailableSeat();
      const reservation = await createReservation(token, seat.id);

      const initiated = await initiatePayment(token, reservation.id, '4111 1111 1111 0000');

      expect(initiated.status).toBe('processing');

      const final = await waitForReservationStatus(token, reservation.id);

      expect(final.status).toBe('cancelled');
      expect(final.payment.status).toBe('failed');
      expect(final.payment.transactionId).toBeNull();
    });

    it('returns 400 when trying to initiate payment for an already-processed reservation', async () => {
      const token = await registerAndLogin('repay@test.com');
      const seat = await getFirstAvailableSeat();
      const reservation = await createReservation(token, seat.id);

      await initiatePayment(token, reservation.id, '4111 1111 1111 1234');
      await waitForReservationStatus(token, reservation.id);

      await request(app.getHttpServer())
        .post(`/api/payments/initiate/${reservation.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ cardNumber: '4111 1111 1111 1234', expiry: '12/27', cvv: '123', cardholderName: 'Test' })
        .expect(400);
    });
  });
});
