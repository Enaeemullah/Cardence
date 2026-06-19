import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthorizationService } from './authorization.service';
import { AuthorizationRequest } from '../entities/authorization-request.entity';
import { Transaction } from '../entities/transaction.entity';
import { PostingEntry } from '../entities/posting-entry.entity';
import { Card } from '../entities/card.entity';
import { CardProduct } from '../entities/card-product.entity';
import { Account } from '../entities/account.entity';
import { CardChannel, CardStatus, PostingDirection, TransactionStatus } from '../common/enums';
import { AuditService } from '../audit/audit.service';
import { AuthorizeDto } from './dto/authorize.dto';

const makeCard = (overrides: Partial<Card> = {}): Card =>
  ({
    id: 'card-uuid',
    accountId: 'account-uuid',
    cardProductId: 'product-uuid',
    status: CardStatus.ACTIVE,
    atmEnabled: null,
    posEnabled: null,
    ecomEnabled: null,
    intlEnabled: null,
    dailyLimitMinorUnits: null,
    perTxnLimitMinorUnits: null,
    ...overrides,
  }) as Card;

const makeProduct = (overrides: Partial<CardProduct> = {}): CardProduct =>
  ({
    id: 'product-uuid',
    atmEnabled: true,
    posEnabled: true,
    ecomEnabled: true,
    intlEnabled: false,
    dailyLimitMinorUnits: '500000',  // 5000.00
    perTxnLimitMinorUnits: '100000', // 1000.00
    velocityCount: 5,
    velocityWindowSeconds: 3600,
    ...overrides,
  }) as CardProduct;

const makeAccount = (overrides: Partial<Account> = {}): Account =>
  ({
    id: 'account-uuid',
    balanceMinorUnits: '1000000', // 10000.00
    version: 1,
    ...overrides,
  }) as Account;

const baseDto: AuthorizeDto = {
  idempotencyKey: 'idem-key-uuid',
  cardId: 'card-uuid',
  channel: CardChannel.POS,
  amountMinorUnits: '10000', // 100.00
  currency: 'USD',
};

describe('AuthorizationService', () => {
  let service: AuthorizationService;
  let authRepo: Record<string, jest.Mock>;
  let txnRepo: Record<string, jest.Mock>;
  let postingRepo: Record<string, jest.Mock>;
  let cardRepo: Record<string, jest.Mock>;
  let productRepo: Record<string, jest.Mock>;
  let accountRepo: Record<string, jest.Mock>;
  let auditService: { log: jest.Mock };

  beforeEach(async () => {
    authRepo = {
      findOneBy: jest.fn(),
      save: jest.fn().mockImplementation((e) => Promise.resolve({ id: 'auth-uuid', ...e })),
      create: jest.fn().mockImplementation((e) => e),
    };
    txnRepo = {
      save: jest.fn().mockImplementation((e) => Promise.resolve({ id: 'txn-uuid', ...e })),
      find: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation((e) => e),
    };
    postingRepo = {
      save: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation((e) => e),
    };
    cardRepo = { findOneBy: jest.fn() };
    productRepo = { findOneBy: jest.fn() };
    accountRepo = {
      findOneBy: jest.fn(),
      save: jest.fn().mockImplementation((e) => Promise.resolve({ ...e })),
    };
    auditService = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorizationService,
        { provide: getRepositoryToken(AuthorizationRequest), useValue: authRepo },
        { provide: getRepositoryToken(Transaction), useValue: txnRepo },
        { provide: getRepositoryToken(PostingEntry), useValue: postingRepo },
        { provide: getRepositoryToken(Card), useValue: cardRepo },
        { provide: getRepositoryToken(CardProduct), useValue: productRepo },
        { provide: getRepositoryToken(Account), useValue: accountRepo },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<AuthorizationService>(AuthorizationService);
  });

  // ── idempotency ───────────────────────────────────────────────────────────

  it('replays cached result for a duplicate idempotency key', async () => {
    const cached = { id: 'auth-uuid', result: TransactionStatus.APPROVED } as AuthorizationRequest;
    authRepo.findOneBy.mockResolvedValue(cached);

    const result = await service.authorize(baseDto);

    expect(result).toBe(cached);
    expect(cardRepo.findOneBy).not.toHaveBeenCalled();
  });

  // ── card checks ───────────────────────────────────────────────────────────

  it('throws NotFoundException when card does not exist', async () => {
    authRepo.findOneBy.mockResolvedValue(null);
    cardRepo.findOneBy.mockResolvedValue(null);

    await expect(service.authorize(baseDto)).rejects.toThrow(NotFoundException);
  });

  it('declines with CARD_NOT_ACTIVE when card status is BLOCKED', async () => {
    authRepo.findOneBy.mockResolvedValue(null);
    cardRepo.findOneBy.mockResolvedValue(makeCard({ status: CardStatus.BLOCKED }));

    const result = await service.authorize(baseDto);

    expect(result.result).toBe(TransactionStatus.DECLINED);
    expect(result.declineReason).toBe('CARD_NOT_ACTIVE');
  });

  it('declines with CARD_NOT_ACTIVE when card is HOTLISTED', async () => {
    authRepo.findOneBy.mockResolvedValue(null);
    cardRepo.findOneBy.mockResolvedValue(makeCard({ status: CardStatus.HOTLISTED }));

    const result = await service.authorize(baseDto);

    expect(result.declineReason).toBe('CARD_NOT_ACTIVE');
  });

  // ── channel checks ────────────────────────────────────────────────────────

  it('declines with CHANNEL_DISABLED when product disables the channel', async () => {
    authRepo.findOneBy.mockResolvedValue(null);
    cardRepo.findOneBy.mockResolvedValue(makeCard());
    productRepo.findOneBy.mockResolvedValue(makeProduct({ intlEnabled: false }));

    const result = await service.authorize({ ...baseDto, channel: CardChannel.INTL });

    expect(result.result).toBe(TransactionStatus.DECLINED);
    expect(result.declineReason).toBe('CHANNEL_DISABLED');
  });

  it('declines when card override explicitly disables a channel the product allows', async () => {
    authRepo.findOneBy.mockResolvedValue(null);
    cardRepo.findOneBy.mockResolvedValue(makeCard({ posEnabled: false }));
    productRepo.findOneBy.mockResolvedValue(makeProduct({ posEnabled: true }));

    const result = await service.authorize(baseDto);

    expect(result.declineReason).toBe('CHANNEL_DISABLED');
  });

  it('approves when card override enables a channel the product disables', async () => {
    authRepo.findOneBy.mockResolvedValue(null);
    cardRepo.findOneBy.mockResolvedValue(makeCard({ intlEnabled: true }));
    productRepo.findOneBy.mockResolvedValue(makeProduct({ intlEnabled: false }));
    accountRepo.findOneBy.mockResolvedValue(makeAccount());
    txnRepo.find.mockResolvedValue([]);
    txnRepo.count.mockResolvedValue(0);

    const result = await service.authorize({ ...baseDto, channel: CardChannel.INTL });

    expect(result.result).toBe(TransactionStatus.APPROVED);
  });

  // ── limit checks ──────────────────────────────────────────────────────────

  it('declines with PER_TXN_LIMIT_EXCEEDED when amount exceeds per-txn limit', async () => {
    authRepo.findOneBy.mockResolvedValue(null);
    cardRepo.findOneBy.mockResolvedValue(makeCard());
    productRepo.findOneBy.mockResolvedValue(makeProduct({ perTxnLimitMinorUnits: '5000' }));

    const result = await service.authorize({ ...baseDto, amountMinorUnits: '5001' });

    expect(result.declineReason).toBe('PER_TXN_LIMIT_EXCEEDED');
  });

  it('uses card-level per-txn limit override over product limit', async () => {
    authRepo.findOneBy.mockResolvedValue(null);
    // Card limit is lower than product limit; amount exceeds card limit
    cardRepo.findOneBy.mockResolvedValue(makeCard({ perTxnLimitMinorUnits: '1000' }));
    productRepo.findOneBy.mockResolvedValue(makeProduct({ perTxnLimitMinorUnits: '100000' }));

    const result = await service.authorize({ ...baseDto, amountMinorUnits: '1001' });

    expect(result.declineReason).toBe('PER_TXN_LIMIT_EXCEEDED');
  });

  it('declines with DAILY_LIMIT_EXCEEDED when cumulative spend would breach the daily limit', async () => {
    authRepo.findOneBy.mockResolvedValue(null);
    cardRepo.findOneBy.mockResolvedValue(makeCard());
    productRepo.findOneBy.mockResolvedValue(makeProduct({ dailyLimitMinorUnits: '500000' }));
    // Already spent 495000; trying to spend 10000 → total 505000 > 500000
    txnRepo.find.mockResolvedValue([{ amountMinorUnits: '495000' }]);

    const result = await service.authorize({ ...baseDto, amountMinorUnits: '10000' });

    expect(result.declineReason).toBe('DAILY_LIMIT_EXCEEDED');
  });

  it('declines with VELOCITY_EXCEEDED when transaction count hits the velocity cap', async () => {
    authRepo.findOneBy.mockResolvedValue(null);
    cardRepo.findOneBy.mockResolvedValue(makeCard());
    productRepo.findOneBy.mockResolvedValue(makeProduct({ velocityCount: 3 }));
    txnRepo.find.mockResolvedValue([]);
    txnRepo.count.mockResolvedValue(3); // already at cap

    const result = await service.authorize(baseDto);

    expect(result.declineReason).toBe('VELOCITY_EXCEEDED');
  });

  it('declines with INSUFFICIENT_FUNDS when account balance is below the transaction amount', async () => {
    authRepo.findOneBy.mockResolvedValue(null);
    cardRepo.findOneBy.mockResolvedValue(makeCard());
    productRepo.findOneBy.mockResolvedValue(makeProduct());
    txnRepo.find.mockResolvedValue([]);
    txnRepo.count.mockResolvedValue(0);
    accountRepo.findOneBy.mockResolvedValue(makeAccount({ balanceMinorUnits: '9999' }));

    const result = await service.authorize({ ...baseDto, amountMinorUnits: '10000' });

    expect(result.declineReason).toBe('INSUFFICIENT_FUNDS');
  });

  // ── happy path ────────────────────────────────────────────────────────────

  it('approves and debits account, creates transaction and double-entry postings', async () => {
    authRepo.findOneBy.mockResolvedValue(null);
    cardRepo.findOneBy.mockResolvedValue(makeCard());
    productRepo.findOneBy.mockResolvedValue(makeProduct());
    txnRepo.find.mockResolvedValue([]);
    txnRepo.count.mockResolvedValue(0);
    accountRepo.findOneBy.mockResolvedValue(makeAccount({ balanceMinorUnits: '1000000' }));

    const result = await service.authorize(baseDto);

    // Account debited
    expect(accountRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ balanceMinorUnits: '990000' }), // 1000000 - 10000
    );

    // Transaction created
    expect(txnRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: TransactionStatus.APPROVED,
        amountMinorUnits: '10000',
        cardId: 'card-uuid',
      }),
    );

    // Two posting entries: DEBIT customer + CREDIT settlement
    expect(postingRepo.save).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ direction: PostingDirection.DEBIT, balanceAfterMinorUnits: '990000' }),
        expect.objectContaining({ direction: PostingDirection.CREDIT }),
      ]),
    );

    // Authorization record returned as APPROVED
    expect(result.result).toBe(TransactionStatus.APPROVED);
    expect(result.declineReason).toBeNull();

    // Audit emitted
    expect(auditService.log).toHaveBeenCalledWith(
      'Transaction',
      expect.any(String),
      'AUTHORIZATION_APPROVED',
      expect.anything(),
    );
  });
});
