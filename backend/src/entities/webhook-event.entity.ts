import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum WebhookEventStatus {
  PAID = 'paid',
  SKIPPED = 'skipped',
  FAILED = 'failed',
}

@Entity('webhook_events')
export class WebhookEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  eventId: string;

  @Column()
  type: string;

  @Column({ type: 'jsonb' })
  payload: object;

  @Column({ type: 'enum', enum: WebhookEventStatus, default: WebhookEventStatus.PAID })
  status: WebhookEventStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
