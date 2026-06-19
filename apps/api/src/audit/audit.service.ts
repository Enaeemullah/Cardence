import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditEvent } from '../entities/audit-event.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditEvent)
    private readonly repo: Repository<AuditEvent>,
  ) {}

  async log(
    entityType: string,
    entityId: string,
    action: string,
    options?: {
      actorUserId?: string;
      previousState?: Record<string, unknown>;
      newState?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    },
  ): Promise<AuditEvent> {
    const event = this.repo.create({
      entityType,
      entityId,
      action,
      actorUserId: options?.actorUserId ?? null,
      previousState: options?.previousState ?? null,
      newState: options?.newState ?? null,
      metadata: options?.metadata ?? null,
    });
    return this.repo.save(event);
  }
}
