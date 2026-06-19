import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Abstract class used as DI token — swap implementation for real HSM in production
export abstract class PinService {
  abstract hashPin(pin: string): Promise<string>;
  abstract verifyPin(pin: string, hash: string): Promise<boolean>;
}

@Injectable()
class BcryptPinService extends PinService {
  private readonly ROUNDS = 12;

  async hashPin(pin: string): Promise<string> {
    return bcrypt.hash(pin, this.ROUNDS);
  }

  async verifyPin(pin: string, hash: string): Promise<boolean> {
    return bcrypt.compare(pin, hash);
  }
}

export { BcryptPinService };
