import { Module } from '@nestjs/common';
import { PinService, BcryptPinService } from './pin.service';

@Module({
  providers: [{ provide: PinService, useClass: BcryptPinService }],
  exports: [PinService],
})
export class PinModule {}
