import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Card } from '../entities/card.entity';
import { Account } from '../entities/account.entity';
import { CardProduct } from '../entities/card-product.entity';
import { MakerCheckerRequest } from '../entities/maker-checker-request.entity';
import { CardLifecycleModule } from '../card-lifecycle/card-lifecycle.module';
import { AuditModule } from '../audit/audit.module';
import { PinModule } from '../pin/pin.module';
import { CardsService } from './cards.service';
import { CardsController } from './cards.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Card, Account, CardProduct, MakerCheckerRequest]),
    CardLifecycleModule,
    AuditModule,
    PinModule,
  ],
  providers: [CardsService],
  controllers: [CardsController],
  exports: [CardsService],
})
export class CardsModule {}
