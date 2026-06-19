import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MakerCheckerService } from './maker-checker.service';
import { MakerCheckerRequest } from '../entities/maker-checker-request.entity';
import { Card } from '../entities/card.entity';
import { CardStatus, MakerCheckerStatus, MakerCheckerType } from '../common/enums';
import { CardLifecycleService } from '../card-lifecycle/card-lifecycle.service';
import { AuditService } from '../audit/audit.service';

const makePending = (overrides: Partial<MakerCheckerRequest> = {}): MakerCheckerRequest =>
  ({
    id: 'appr-uuid',
    type: MakerCheckerType.CARD_ISSUANCE,
    initiatorUserId: 'maker-user',
    approverUserId: null,
    status: MakerCheckerStatus.PENDING,
    payload: { cardId: 'card-uuid' },
    createdAt: new Date(),
    updatedAt: new Date(),
    decidedAt: null,
    ...overrides,
  }) as MakerCheckerRequest;

describe('MakerCheckerService', () => {
  let service: MakerCheckerService;
  let approvalRepo: Record<string, jest.Mock>;
  let cardRepo: Record<string, jest.Mock>;
  let auditService: { log: jest.Mock };

  beforeEach(async () => {
    approvalRepo = { findOneBy: jest.fn(), find: jest.fn(), save: jest.fn() };
    cardRepo = { findOneBy: jest.fn(), save: jest.fn() };
    auditService = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MakerCheckerService,
        CardLifecycleService,
        { provide: getRepositoryToken(MakerCheckerRequest), useValue: approvalRepo },
        { provide: getRepositoryToken(Card), useValue: cardRepo },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<MakerCheckerService>(MakerCheckerService);
  });

  // ── approve ───────────────────────────────────────────────────────────────

  describe('approve', () => {
    it('transitions card REQUESTED → ISSUED on CARD_ISSUANCE', async () => {
      const approval = makePending();
      approvalRepo.findOneBy.mockResolvedValue(approval);
      const card = { id: 'card-uuid', status: CardStatus.REQUESTED } as Card;
      cardRepo.findOneBy.mockResolvedValue(card);
      cardRepo.save.mockImplementation((c: Card) => Promise.resolve({ ...c }));
      approvalRepo.save.mockImplementation((a: MakerCheckerRequest) => Promise.resolve({ ...a }));

      const result = await service.approve('appr-uuid', 'checker-user');

      expect(cardRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: CardStatus.ISSUED }),
      );
      expect(result.status).toBe(MakerCheckerStatus.APPROVED);
      expect(result.approverUserId).toBe('checker-user');
      expect(result.decidedAt).toBeInstanceOf(Date);
    });

    it('updates card limits on LIMIT_CHANGE approval', async () => {
      const approval = makePending({
        type: MakerCheckerType.LIMIT_CHANGE,
        payload: {
          cardId: 'card-uuid',
          dailyLimitMinorUnits: '1000000',
          perTxnLimitMinorUnits: '200000',
        },
      });
      approvalRepo.findOneBy.mockResolvedValue(approval);
      const card = { id: 'card-uuid', status: CardStatus.ACTIVE, dailyLimitMinorUnits: null, perTxnLimitMinorUnits: null } as Card;
      cardRepo.findOneBy.mockResolvedValue(card);
      cardRepo.save.mockImplementation((c: Card) => Promise.resolve({ ...c }));
      approvalRepo.save.mockImplementation((a: MakerCheckerRequest) => Promise.resolve({ ...a }));

      await service.approve('appr-uuid', 'checker-user');

      expect(cardRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          dailyLimitMinorUnits: '1000000',
          perTxnLimitMinorUnits: '200000',
        }),
      );
    });

    it('throws BadRequestException when not PENDING', async () => {
      approvalRepo.findOneBy.mockResolvedValue(makePending({ status: MakerCheckerStatus.APPROVED }));
      await expect(service.approve('appr-uuid', 'checker-user')).rejects.toThrow(BadRequestException);
    });

    it('enforces four-eyes principle: maker cannot approve own request', async () => {
      approvalRepo.findOneBy.mockResolvedValue(makePending({ initiatorUserId: 'same-user' }));
      await expect(service.approve('appr-uuid', 'same-user')).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when approval does not exist', async () => {
      approvalRepo.findOneBy.mockResolvedValue(null);
      await expect(service.approve('missing', 'checker-user')).rejects.toThrow(NotFoundException);
    });
  });

  // ── reject ────────────────────────────────────────────────────────────────

  describe('reject', () => {
    it('marks approval as REJECTED without touching card', async () => {
      approvalRepo.findOneBy.mockResolvedValue(makePending());
      approvalRepo.save.mockImplementation((a: MakerCheckerRequest) => Promise.resolve({ ...a }));

      const result = await service.reject('appr-uuid', 'checker-user');

      expect(result.status).toBe(MakerCheckerStatus.REJECTED);
      expect(cardRepo.save).not.toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        'MakerCheckerRequest',
        'appr-uuid',
        'APPROVAL_REJECTED',
        expect.anything(),
      );
    });

    it('enforces four-eyes principle on reject', async () => {
      approvalRepo.findOneBy.mockResolvedValue(makePending({ initiatorUserId: 'same-user' }));
      await expect(service.reject('appr-uuid', 'same-user')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when already decided', async () => {
      approvalRepo.findOneBy.mockResolvedValue(makePending({ status: MakerCheckerStatus.REJECTED }));
      await expect(service.reject('appr-uuid', 'checker-user')).rejects.toThrow(BadRequestException);
    });
  });
});
