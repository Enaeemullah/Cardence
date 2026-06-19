import { Injectable } from '@nestjs/common';
import { CardStatus } from '../common/enums';
import { CardTransitionException } from '../common/exceptions/card-transition.exception';
import { Card } from '../entities/card.entity';

const LEGAL_TRANSITIONS: Readonly<Record<CardStatus, readonly CardStatus[]>> = {
  [CardStatus.REQUESTED]: [CardStatus.ISSUED],
  [CardStatus.ISSUED]: [CardStatus.ACTIVE],
  [CardStatus.ACTIVE]: [
    CardStatus.BLOCKED,
    CardStatus.HOTLISTED,
    CardStatus.EXPIRED,
    CardStatus.CLOSED,
  ],
  [CardStatus.BLOCKED]: [CardStatus.ACTIVE, CardStatus.HOTLISTED, CardStatus.CLOSED],
  [CardStatus.HOTLISTED]: [CardStatus.CLOSED],
  [CardStatus.EXPIRED]: [CardStatus.CLOSED],
  [CardStatus.CLOSED]: [],
};

@Injectable()
export class CardLifecycleService {
  canTransition(from: CardStatus, to: CardStatus): boolean {
    return (LEGAL_TRANSITIONS[from] as CardStatus[]).includes(to);
  }

  assertTransition(from: CardStatus, to: CardStatus): void {
    if (!this.canTransition(from, to)) {
      throw new CardTransitionException(from, to);
    }
  }

  /** Guards the transition and returns the new status. */
  transition(card: Pick<Card, 'status'>, to: CardStatus): CardStatus {
    this.assertTransition(card.status, to);
    return to;
  }
}
