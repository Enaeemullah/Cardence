import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { CardChannel, TransactionStatus } from '../common/enums';

@Entity('authorization_requests')
export class AuthorizationRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'card_id', type: 'varchar', length: 36 })
  cardId: string;

  @Column({ name: 'idempotency_key', length: 100, unique: true })
  idempotencyKey: string;

  @Column({ type: 'enum', enum: CardChannel })
  channel: CardChannel;

  @Column({ name: 'amount_minor_units', type: 'bigint' })
  amountMinorUnits: string;

  @Column({ length: 3 })
  currency: string;

  @Column({ name: 'merchant_name', type: 'varchar', length: 200, nullable: true })
  merchantName: string | null;

  @Column({ name: 'merchant_code', type: 'varchar', length: 20, nullable: true })
  merchantCode: string | null;

  @Column({ type: 'enum', enum: TransactionStatus })
  result: TransactionStatus;

  @Column({ name: 'decline_reason', type: 'varchar', length: 100, nullable: true })
  declineReason: string | null;

  @CreateDateColumn({ name: 'requested_at' })
  requestedAt: Date;
}
