import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MakerCheckerRequest } from '../entities/maker-checker-request.entity';
import { Card } from '../entities/card.entity';
import { CardLifecycleModule } from '../card-lifecycle/card-lifecycle.module';
import { AuditModule } from '../audit/audit.module';
import { MakerCheckerService } from './maker-checker.service';
import { MakerCheckerController } from './maker-checker.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([MakerCheckerRequest, Card]),
    CardLifecycleModule,
    AuditModule,
  ],
  providers: [MakerCheckerService],
  controllers: [MakerCheckerController],
  exports: [MakerCheckerService],
})
export class MakerCheckerModule {}
