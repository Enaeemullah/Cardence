import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CardsService } from './cards.service';
import { Card } from '../entities/card.entity';
import { Account } from '../entities/account.entity';
import { CardProduct } from '../entities/card-product.entity';
import { MakerCheckerRequest } from '../entities/maker-checker-request.entity';
import { Transaction } from '../entities/transaction.entity';
import { CardStatus } from '../common/enums';
import { CardLifecycleService } from '../card-lifecycle/card-lifecycle.service';
import { AuditService } from '../audit/audit.service';
import { PinService } from '../pin/pin.service';

const makeCard = (overrides: Partial<Card> = {}): Card =>
  ({
    id: 'card-uuid',
    accountId: 'acc-uuid',
    cardProductId: 'prod-uuid',
    panToken: 'tok-uuid',
    panLast4: '1234',
    panMasked: '****-****-****-1234',
    expiryMonth: 12,
    expiryYear: 2025,
    status: CardStatus.ISSUED,
    pinBlockHash: null,
    dailyLimitMinorUnits: null,
    perTxnLimitMinorUnits: null,
    atmEnabled: null,
    posEnabled: null,
    ecomEnabled: null,
    intlEnabled: null,
    parentCardId: null,
    closedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as Card;

describe('CardsService', () => {
  let service: CardsService;
  let cardRepo: Record<string, jest.Mock>;
  let accountRepo: Record<string, jest.Mock>;
  let cardProductRepo: Record<string, jest.Mock>;
  let approvalRepo: Record<string, jest.Mock>;
  let txnRepo: Record<string, jest.Mock>;
  let auditService: { log: jest.Mock };
  let pinService: { hashPin: jest.Mock; verifyPin: jest.Mock };

  beforeEach(async () => {
    cardRepo = { findOneBy: jest.fn(), findBy: jest.fn(), create: jest.fn(), save: jest.fn() };
    accountRepo = { findOneBy: jest.fn() };
    cardProductRepo = { findOneBy: jest.fn() };
    approvalRepo = { create: jest.fn(), save: jest.fn() };
    txnRepo = { find: jest.fn().mockResolvedValue([]) };
    auditService = { log: jest.fn().mockResolvedValue(undefined) };
    pinService = { hashPin: jest.fn().mockResolvedValue('$2b$12$hashed'), verifyPin: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CardsService,
        CardLifecycleService,
        { provide: getRepositoryToken(Card), useValue: cardRepo },
        { provide: getRepositoryToken(Account), useValue: accountRepo },
        { provide: getRepositoryToken(CardProduct), useValue: cardProductRepo },
        { provide: getRepositoryToken(MakerCheckerRequest), useValue: approvalRepo },
        { provide: getRepositoryToken(Transaction), useValue: txnRepo },
        { provide: AuditService, useValue: auditService },
        { provide: PinService, useValue: pinService },
      ],
    }).compile();

    service = module.get<CardsService>(CardsService);
  });

  // ── findOne ───────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns card when found', async () => {
      const card = makeCard();
      cardRepo.findOneBy.mockResolvedValue(card);
      await expect(service.findOne('card-uuid')).resolves.toBe(card);
    });

    it('throws NotFoundException when missing', async () => {
      cardRepo.findOneBy.mockResolvedValue(null);
      await expect(service.findOne('nope')).rejects.toThrow(NotFoundException);
    });
  });

  // ── activate ──────────────────────────────────────────────────────────────

  describe('activate', () => {
    it('transitions ISSUED → ACTIVE and emits audit event', async () => {
      const card = makeCard({ status: CardStatus.ISSUED });
      cardRepo.findOneBy.mockResolvedValue(card);
      cardRepo.save.mockImplementation((c: Card) => Promise.resolve({ ...c }));

      const result = await service.activate('card-uuid', 'user-1');

      expect(result.status).toBe(CardStatus.ACTIVE);
      expect(auditService.log).toHaveBeenCalledWith('Card', 'card-uuid', 'CARD_ACTIVATED', expect.objectContaining({
        actorUserId: 'user-1',
        previousState: { status: CardStatus.ISSUED },
        newState: { status: CardStatus.ACTIVE },
      }));
    });

    it('rejects illegal transition (CLOSED → ACTIVE)', async () => {
      cardRepo.findOneBy.mockResolvedValue(makeCard({ status: CardStatus.CLOSED }));
      await expect(service.activate('card-uuid')).rejects.toThrow(/CLOSED.*ACTIVE/);
    });
  });

  // ── block ─────────────────────────────────────────────────────────────────

  describe('block', () => {
    it('transitions ACTIVE → BLOCKED', async () => {
      cardRepo.findOneBy.mockResolvedValue(makeCard({ status: CardStatus.ACTIVE }));
      cardRepo.save.mockImplementation((c: Card) => Promise.resolve({ ...c }));
      const result = await service.block('card-uuid', 'user-1');
      expect(result.status).toBe(CardStatus.BLOCKED);
      expect(auditService.log).toHaveBeenCalledWith('Card', 'card-uuid', 'CARD_BLOCKED', expect.anything());
    });

    it('rejects block on REQUESTED card', async () => {
      cardRepo.findOneBy.mockResolvedValue(makeCard({ status: CardStatus.REQUESTED }));
      await expect(service.block('card-uuid')).rejects.toThrow(/REQUESTED.*BLOCKED/);
    });
  });

  // ── unblock ───────────────────────────────────────────────────────────────

  describe('unblock', () => {
    it('transitions BLOCKED → ACTIVE', async () => {
      cardRepo.findOneBy.mockResolvedValue(makeCard({ status: CardStatus.BLOCKED }));
      cardRepo.save.mockImplementation((c: Card) => Promise.resolve({ ...c }));
      const result = await service.unblock('card-uuid');
      expect(result.status).toBe(CardStatus.ACTIVE);
    });
  });

  // ── hotlist ───────────────────────────────────────────────────────────────

  describe('hotlist', () => {
    it.each([CardStatus.ACTIVE, CardStatus.BLOCKED])(
      'hotlists a %s card',
      async (from) => {
        cardRepo.findOneBy.mockResolvedValue(makeCard({ status: from }));
        cardRepo.save.mockImplementation((c: Card) => Promise.resolve({ ...c }));
        const result = await service.hotlist('card-uuid', 'user-1');
        expect(result.status).toBe(CardStatus.HOTLISTED);
        expect(auditService.log).toHaveBeenCalledWith('Card', 'card-uuid', 'CARD_HOTLISTED', expect.anything());
      },
    );

    it('rejects hotlist on CLOSED card', async () => {
      cardRepo.findOneBy.mockResolvedValue(makeCard({ status: CardStatus.CLOSED }));
      await expect(service.hotlist('card-uuid')).rejects.toThrow(/CLOSED.*HOTLISTED/);
    });
  });

  // ── setPin ────────────────────────────────────────────────────────────────

  describe('setPin', () => {
    it('hashes PIN and stores hash — plaintext never saved or logged', async () => {
      const card = makeCard({ status: CardStatus.ACTIVE });
      cardRepo.findOneBy.mockResolvedValue(card);
      cardRepo.save.mockResolvedValue(card);

      await service.setPin('card-uuid', '1234', 'user-1');

      expect(pinService.hashPin).toHaveBeenCalledWith('1234');
      expect(cardRepo.save.mock.calls[0][0].pinBlockHash).toBe('$2b$12$hashed');
      // Audit log must NOT contain the plaintext PIN
      expect(JSON.stringify(auditService.log.mock.calls)).not.toContain('1234');
    });

    it('rejects PIN set on BLOCKED card', async () => {
      cardRepo.findOneBy.mockResolvedValue(makeCard({ status: CardStatus.BLOCKED }));
      await expect(service.setPin('card-uuid', '9999')).rejects.toThrow(BadRequestException);
    });
  });

  // ── resetPin ──────────────────────────────────────────────────────────────

  describe('resetPin', () => {
    it('clears pin_block_hash to null', async () => {
      const card = makeCard({ status: CardStatus.ACTIVE, pinBlockHash: '$2b$12$old' });
      cardRepo.findOneBy.mockResolvedValue(card);
      cardRepo.save.mockResolvedValue(card);

      await service.resetPin('card-uuid', 'user-1');

      expect(cardRepo.save.mock.calls[0][0].pinBlockHash).toBeNull();
      expect(auditService.log).toHaveBeenCalledWith('Card', 'card-uuid', 'CARD_PIN_RESET', expect.anything());
    });
  });

  // ── renew ─────────────────────────────────────────────────────────────────

  describe('renew', () => {
    it('extends expiry by 3 years on ACTIVE card', async () => {
      const card = makeCard({ status: CardStatus.ACTIVE, expiryYear: 2020 });
      cardRepo.findOneBy.mockResolvedValue(card);
      cardRepo.save.mockImplementation((c: Card) => Promise.resolve({ ...c }));
      const result = await service.renew('card-uuid', 'user-1');
      expect(result.expiryYear).toBeGreaterThanOrEqual(new Date().getFullYear() + 2);
    });

    it('rejects renew on non-ACTIVE card', async () => {
      cardRepo.findOneBy.mockResolvedValue(makeCard({ status: CardStatus.BLOCKED }));
      await expect(service.renew('card-uuid')).rejects.toThrow(BadRequestException);
    });
  });

  // ── close ─────────────────────────────────────────────────────────────────

  describe('close', () => {
    it.each([CardStatus.ACTIVE, CardStatus.BLOCKED, CardStatus.HOTLISTED, CardStatus.EXPIRED])(
      'closes a %s card and sets closedAt',
      async (from) => {
        cardRepo.findOneBy.mockResolvedValue(makeCard({ status: from }));
        cardRepo.save.mockImplementation((c: Card) => Promise.resolve({ ...c }));
        const result = await service.close('card-uuid', 'user-1');
        expect(result.status).toBe(CardStatus.CLOSED);
        expect(result.closedAt).toBeInstanceOf(Date);
        expect(auditService.log).toHaveBeenCalledWith('Card', 'card-uuid', 'CARD_CLOSED', expect.anything());
      },
    );

    it('rejects closing an already-CLOSED card', async () => {
      cardRepo.findOneBy.mockResolvedValue(makeCard({ status: CardStatus.CLOSED }));
      await expect(service.close('card-uuid')).rejects.toThrow(/CLOSED.*CLOSED/);
    });
  });

  // ── requestLimitChange ────────────────────────────────────────────────────

  describe('requestLimitChange', () => {
    it('creates a LIMIT_CHANGE maker-checker request', async () => {
      const card = makeCard({ status: CardStatus.ACTIVE });
      cardRepo.findOneBy.mockResolvedValue(card);
      const fakeApproval = { id: 'appr-1', type: 'LIMIT_CHANGE' };
      approvalRepo.create.mockReturnValue(fakeApproval);
      approvalRepo.save.mockResolvedValue(fakeApproval);

      const result = await service.requestLimitChange(
        'card-uuid',
        { dailyLimitMinorUnits: 500000 },
        'user-1',
      );

      expect(approvalRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ payload: expect.objectContaining({ dailyLimitMinorUnits: '500000' }) }),
      );
      expect(result).toBe(fakeApproval);
    });

    it('rejects if neither limit is specified', async () => {
      cardRepo.findOneBy.mockResolvedValue(makeCard({ status: CardStatus.ACTIVE }));
      await expect(service.requestLimitChange('card-uuid', {})).rejects.toThrow(BadRequestException);
    });
  });
});
