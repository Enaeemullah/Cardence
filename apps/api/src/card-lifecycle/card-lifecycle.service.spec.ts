import { CardLifecycleService } from './card-lifecycle.service';
import { CardStatus } from '../common/enums';
import { CardTransitionException } from '../common/exceptions/card-transition.exception';

describe('CardLifecycleService', () => {
  let service: CardLifecycleService;

  beforeEach(() => {
    service = new CardLifecycleService();
  });

  // ── Legal transitions ─────────────────────────────────────────────────────

  describe('legal transitions', () => {
    const cases: [CardStatus, CardStatus][] = [
      [CardStatus.REQUESTED, CardStatus.ISSUED],
      [CardStatus.ISSUED, CardStatus.ACTIVE],
      [CardStatus.ACTIVE, CardStatus.BLOCKED],
      [CardStatus.ACTIVE, CardStatus.HOTLISTED],
      [CardStatus.ACTIVE, CardStatus.EXPIRED],
      [CardStatus.ACTIVE, CardStatus.CLOSED],
      [CardStatus.BLOCKED, CardStatus.ACTIVE],
      [CardStatus.BLOCKED, CardStatus.HOTLISTED],
      [CardStatus.BLOCKED, CardStatus.CLOSED],
      [CardStatus.HOTLISTED, CardStatus.CLOSED],
      [CardStatus.EXPIRED, CardStatus.CLOSED],
    ];

    test.each(cases)('%s → %s is permitted', (from, to) => {
      expect(service.canTransition(from, to)).toBe(true);
      expect(() => service.assertTransition(from, to)).not.toThrow();
    });
  });

  // ── Illegal transitions ───────────────────────────────────────────────────

  describe('illegal transitions', () => {
    const cases: [CardStatus, CardStatus][] = [
      // Can't skip ISSUED
      [CardStatus.REQUESTED, CardStatus.ACTIVE],
      [CardStatus.REQUESTED, CardStatus.BLOCKED],
      [CardStatus.REQUESTED, CardStatus.HOTLISTED],
      [CardStatus.REQUESTED, CardStatus.CLOSED],
      // ISSUED can only activate
      [CardStatus.ISSUED, CardStatus.BLOCKED],
      [CardStatus.ISSUED, CardStatus.HOTLISTED],
      [CardStatus.ISSUED, CardStatus.CLOSED],
      [CardStatus.ISSUED, CardStatus.EXPIRED],
      // ACTIVE can't go backwards
      [CardStatus.ACTIVE, CardStatus.REQUESTED],
      [CardStatus.ACTIVE, CardStatus.ISSUED],
      // BLOCKED can't expire
      [CardStatus.BLOCKED, CardStatus.EXPIRED],
      [CardStatus.BLOCKED, CardStatus.REQUESTED],
      [CardStatus.BLOCKED, CardStatus.ISSUED],
      // HOTLISTED can only be closed
      [CardStatus.HOTLISTED, CardStatus.ACTIVE],
      [CardStatus.HOTLISTED, CardStatus.BLOCKED],
      [CardStatus.HOTLISTED, CardStatus.EXPIRED],
      // EXPIRED can only be closed
      [CardStatus.EXPIRED, CardStatus.ACTIVE],
      [CardStatus.EXPIRED, CardStatus.BLOCKED],
      [CardStatus.EXPIRED, CardStatus.HOTLISTED],
      // CLOSED is terminal
      [CardStatus.CLOSED, CardStatus.ACTIVE],
      [CardStatus.CLOSED, CardStatus.BLOCKED],
      [CardStatus.CLOSED, CardStatus.HOTLISTED],
      [CardStatus.CLOSED, CardStatus.EXPIRED],
      [CardStatus.CLOSED, CardStatus.REQUESTED],
    ];

    test.each(cases)('%s → %s is rejected', (from, to) => {
      expect(service.canTransition(from, to)).toBe(false);
      expect(() => service.assertTransition(from, to)).toThrow(CardTransitionException);
    });
  });

  // ── transition() helper ───────────────────────────────────────────────────

  describe('transition()', () => {
    it('returns the new status on a legal transition', () => {
      const card = { status: CardStatus.REQUESTED };
      expect(service.transition(card, CardStatus.ISSUED)).toBe(CardStatus.ISSUED);
    });

    it('chains correctly through the lifecycle', () => {
      let card = { status: CardStatus.REQUESTED };
      card.status = service.transition(card, CardStatus.ISSUED);
      card.status = service.transition(card, CardStatus.ACTIVE);
      card.status = service.transition(card, CardStatus.BLOCKED);
      card.status = service.transition(card, CardStatus.ACTIVE);
      card.status = service.transition(card, CardStatus.HOTLISTED);
      card.status = service.transition(card, CardStatus.CLOSED);
      expect(card.status).toBe(CardStatus.CLOSED);
    });

    it('throws CardTransitionException on illegal transition', () => {
      const card = { status: CardStatus.CLOSED };
      expect(() => service.transition(card, CardStatus.ACTIVE)).toThrow(CardTransitionException);
    });

    it('exception message identifies the illegal pair', () => {
      const card = { status: CardStatus.HOTLISTED };
      expect(() => service.transition(card, CardStatus.ACTIVE)).toThrow(
        /HOTLISTED.*ACTIVE/,
      );
    });
  });
});
