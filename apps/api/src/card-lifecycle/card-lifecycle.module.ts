import { Module } from '@nestjs/common';
import { CardLifecycleService } from './card-lifecycle.service';

@Module({
  providers: [CardLifecycleService],
  exports: [CardLifecycleService],
})
export class CardLifecycleModule {}
