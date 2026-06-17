import { Payment } from '../../entities/payment.entity';

export interface IPaymentsRepository {
  createPending(reservationId: string, amount: number): Promise<Payment>;
}
