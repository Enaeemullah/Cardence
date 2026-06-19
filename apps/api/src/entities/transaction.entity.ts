import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { CardChannel, TransactionStatus, TransactionType } from '../common/enums';

// Append-only — no UPDATE or DELETE ever issued against this table
@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'card_id', type: 'varchar', length: 36 })
  cardId: string;

  @Column({ name: 'account_id', type: 'varchar', length: 36 })
  accountId: string;

  @Column({ name: 'reference_number', length: 50, unique: true })
  referenceNumber: string;

  @Column({ name: 'idempotency_key', length: 100, unique: true })
  idempotencyKey: string;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

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
  status: TransactionStatus;

  @Column({ name: 'decline_reason', type: 'varchar', length: 100, nullable: true })
  declineReason: string | null;

  @CreateDateColumn({ name: 'posted_at' })
  postedAt: Date;
}
