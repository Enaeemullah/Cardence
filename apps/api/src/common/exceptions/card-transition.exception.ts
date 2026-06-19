import { BadRequestException } from '@nestjs/common';
import { CardStatus } from '../enums';

export class CardTransitionException extends BadRequestException {
  constructor(from: CardStatus, to: CardStatus) {
    super(`Illegal card status transition: ${from} → ${to}`);
  }
}
