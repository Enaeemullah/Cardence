import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Append-only — every state change in the system writes one AuditEvent
@Entity('audit_events')
export class AuditEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'entity_type', length: 50 })
  entityType: string;

  @Column({ name: 'entity_id', type: 'varchar', length: 36 })
  entityId: string;

  @Column({ length: 80 })
  action: string;

  @Column({ name: 'actor_user_id', type: 'varchar', length: 36, nullable: true })
  actorUserId: string | null;

  @Column({ name: 'previous_state', type: 'json', nullable: true })
  previousState: Record<string, unknown> | null;

  @Column({ name: 'new_state', type: 'json', nullable: true })
  newState: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'occurred_at' })
  occurredAt: Date;
}
