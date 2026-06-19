import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CardStatus } from '../common/enums';

@Entity('cards')
export class Card {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'account_id', type: 'varchar', length: 36 })
  accountId: string;

  @Column({ name: 'card_product_id', type: 'varchar', length: 36 })
  cardProductId: string;

  // Opaque token — raw PAN is never stored
  @Column({ name: 'pan_token', length: 64, unique: true })
  panToken: string;

  @Column({ name: 'pan_last4', length: 4 })
  panLast4: string;

  @Column({ name: 'pan_masked', length: 25 })
  panMasked: string;

  @Column({ name: 'expiry_month', type: 'tinyint', unsigned: true })
  expiryMonth: number;

  @Column({ name: 'expiry_year', type: 'smallint', unsigned: true })
  expiryYear: number;

  @Column({ type: 'enum', enum: CardStatus, default: CardStatus.REQUESTED })
  status: CardStatus;

  // Placeholder for real HSM PIN-block; stores bcrypt hash only
  @Column({ name: 'pin_block_hash', length: 255, nullable: true })
  pinBlockHash: string | null;

  // NULL = inherit from CardProduct
  @Column({ name: 'daily_limit_minor_units', type: 'bigint', nullable: true })
  dailyLimitMinorUnits: string | null;

  @Column({ name: 'per_txn_limit_minor_units', type: 'bigint', nullable: true })
  perTxnLimitMinorUnits: string | null;

  @Column({ name: 'atm_enabled', type: 'boolean', nullable: true })
  atmEnabled: boolean | null;

  @Column({ name: 'pos_enabled', type: 'boolean', nullable: true })
  posEnabled: boolean | null;

  @Column({ name: 'ecom_enabled', type: 'boolean', nullable: true })
  ecomEnabled: boolean | null;

  @Column({ name: 'intl_enabled', type: 'boolean', nullable: true })
  intlEnabled: boolean | null;

  // Set on renew or replace to link cards in the same lineage
  @Column({ name: 'parent_card_id', type: 'varchar', length: 36, nullable: true })
  parentCardId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'closed_at', type: 'timestamp', nullable: true })
  closedAt: Date | null;
}
