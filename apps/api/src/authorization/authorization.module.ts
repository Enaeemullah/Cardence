import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthorizationRequest } from '../entities/authorization-request.entity';
import { Transaction } from '../entities/transaction.entity';
import { PostingEntry } from '../entities/posting-entry.entity';
import { Card } from '../entities/card.entity';
import { CardProduct } from '../entities/card-product.entity';
import { Account } from '../entities/account.entity';
import { AuditModule } from '../audit/audit.module';
import { AuthorizationService } from './authorization.service';
import { AuthorizationController } from './authorization.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuthorizationRequest, Transaction, PostingEntry, Card, CardProduct, Account]),
    AuditModule,
  ],
  providers: [AuthorizationService],
  controllers: [AuthorizationController],
  exports: [AuthorizationService],
})
export class AuthorizationModule {}
