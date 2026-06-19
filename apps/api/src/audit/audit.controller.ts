import { Controller, Get, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { AuditEvent } from '../entities/audit-event.entity';

@Controller('audit-events')
export class AuditController {
  constructor(
    @InjectRepository(AuditEvent)
    private readonly repo: Repository<AuditEvent>,
  ) {}

  @Get()
  findAll(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
  ) {
    const where: FindOptionsWhere<AuditEvent> = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    return this.repo.find({ where, order: { occurredAt: 'DESC' }, take: 200 });
  }
}
