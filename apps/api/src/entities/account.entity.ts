import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { AccountStatus } from '../common/enums';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_id', type: 'varchar', length: 36 })
  customerId: string;

  @Column({ name: 'account_number', length: 20, unique: true })
  accountNumber: string;

  @Column({ length: 3 })
  currency: string;

  // Stored as BIGINT; TypeORM returns MySQL bigint as string
  @Column({ name: 'balance_minor_units', type: 'bigint', default: 0 })
  balanceMinorUnits: string;

  @VersionColumn()
  version: number;

  @Column({ type: 'enum', enum: AccountStatus, default: AccountStatus.ACTIVE })
  status: AccountStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
