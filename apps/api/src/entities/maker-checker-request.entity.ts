import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MakerCheckerStatus, MakerCheckerType } from '../common/enums';

@Entity('maker_checker_requests')
export class MakerCheckerRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: MakerCheckerType })
  type: MakerCheckerType;

  @Column({ name: 'initiator_user_id', type: 'varchar', length: 36 })
  initiatorUserId: string;

  @Column({ name: 'approver_user_id', type: 'varchar', length: 36, nullable: true })
  approverUserId: string | null;

  @Column({ type: 'enum', enum: MakerCheckerStatus, default: MakerCheckerStatus.PENDING })
  status: MakerCheckerStatus;

  @Column({ type: 'json' })
  payload: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'decided_at', type: 'timestamp', nullable: true })
  decidedAt: Date | null;
}
