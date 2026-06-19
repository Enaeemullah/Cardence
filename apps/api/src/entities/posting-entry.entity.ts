import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { PostingDirection } from '../common/enums';

// Append-only double-entry ledger — no UPDATE or DELETE ever issued
@Entity('posting_entries')
export class PostingEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'transaction_id', type: 'varchar', length: 36 })
  transactionId: string;

  @Column({ name: 'account_id', type: 'varchar', length: 36 })
  accountId: string;

  @Column({ type: 'enum', enum: PostingDirection })
  direction: PostingDirection;

  @Column({ name: 'amount_minor_units', type: 'bigint' })
  amountMinorUnits: string;

  // Snapshot of account balance immediately after this entry was posted
  @Column({ name: 'balance_after_minor_units', type: 'bigint' })
  balanceAfterMinorUnits: string;

  @CreateDateColumn({ name: 'posted_at' })
  postedAt: Date;
}
