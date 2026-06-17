import { ProcessPaymentDto } from '../dto/process-payment.dto';

export interface InitiatePaymentResult {
  status: 'processing';
  reservationId: string;
  paymentId: string;
}

export interface IPaymentsService {
  initiate(userId: string, reservationId: string, dto: ProcessPaymentDto): Promise<InitiatePaymentResult>;
}
