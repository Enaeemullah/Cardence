import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardProduct } from '../entities/card-product.entity';
import { AuditModule } from '../audit/audit.module';
import { CardProductsService } from './card-products.service';
import { CardProductsController } from './card-products.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CardProduct]), AuditModule],
  providers: [CardProductsService],
  controllers: [CardProductsController],
  exports: [CardProductsService],
})
export class CardProductsModule {}
