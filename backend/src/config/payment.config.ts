import { registerAs } from '@nestjs/config';

export default registerAs('payment', () => ({
  seatPrice: parseFloat(process.env.SEAT_PRICE) || 50.0,
  pendingExpiryMinutes: parseInt(process.env.PENDING_EXPIRY_MINUTES, 10) || 15,
  webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || 'dev-webhook-secret-change-in-production',
}));
