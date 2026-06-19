import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CardNetwork, CardProductType } from '../common/enums';

@Entity('card_products')
export class CardProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'enum', enum: CardNetwork })
  network: CardNetwork;

  @Column({ name: 'product_type', type: 'enum', enum: CardProductType })
  productType: CardProductType;

  @Column({ name: 'daily_limit_minor_units', type: 'bigint' })
  dailyLimitMinorUnits: string;

  @Column({ name: 'per_txn_limit_minor_units', type: 'bigint' })
  perTxnLimitMinorUnits: string;

  @Column({ name: 'velocity_count', type: 'int' })
  velocityCount: number;

  @Column({ name: 'velocity_window_seconds', type: 'int' })
  velocityWindowSeconds: number;

  @Column({ name: 'atm_enabled', type: 'boolean', default: true })
  atmEnabled: boolean;

  @Column({ name: 'pos_enabled', type: 'boolean', default: true })
  posEnabled: boolean;

  @Column({ name: 'ecom_enabled', type: 'boolean', default: true })
  ecomEnabled: boolean;

  @Column({ name: 'intl_enabled', type: 'boolean', default: false })
  intlEnabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
