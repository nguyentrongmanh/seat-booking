import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Payment, PaymentStatus } from '../../entities/payment.entity';
import { IPaymentsRepository } from '../interfaces/payments-repository.interface';

@Injectable()
export class PaymentsRepository implements IPaymentsRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async createPending(reservationId: string, amount: number): Promise<Payment> {
    const repo = this.dataSource.getRepository(Payment);
    return repo.save(repo.create({ reservationId, amount, status: PaymentStatus.PENDING }));
  }
}
