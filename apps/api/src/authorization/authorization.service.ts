import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { AuthorizationRequest } from '../entities/authorization-request.entity';
import { Transaction } from '../entities/transaction.entity';
import { PostingEntry } from '../entities/posting-entry.entity';
import { Card } from '../entities/card.entity';
import { CardProduct } from '../entities/card-product.entity';
import { Account } from '../entities/account.entity';
import {
  CardChannel,
  CardStatus,
  PostingDirection,
  TransactionStatus,
  TransactionType,
} from '../common/enums';
import { AuditService } from '../audit/audit.service';
import { AuthorizeDto } from './dto/authorize.dto';

// Synthetic settlement account for the double-entry credit side
const SETTLEMENT_ACCOUNT_ID = '00000000-0000-0000-0000-000000000001';

type ChannelFlagKey = 'atmEnabled' | 'posEnabled' | 'ecomEnabled' | 'intlEnabled';

const CHANNEL_FLAG: Record<CardChannel, ChannelFlagKey> = {
  [CardChannel.ATM]: 'atmEnabled',
  [CardChannel.POS]: 'posEnabled',
  [CardChannel.ECOM]: 'ecomEnabled',
  [CardChannel.INTL]: 'intlEnabled',
};

@Injectable()
export class AuthorizationService {
  constructor(
    @InjectRepository(AuthorizationRequest)
    private readonly authRepo: Repository<AuthorizationRequest>,
    @InjectRepository(Transaction)
    private readonly txnRepo: Repository<Transaction>,
    @InjectRepository(PostingEntry)
    private readonly postingRepo: Repository<PostingEntry>,
    @InjectRepository(Card)
    private readonly cardRepo: Repository<Card>,
    @InjectRepository(CardProduct)
    private readonly productRepo: Repository<CardProduct>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    private readonly auditService: AuditService,
  ) {}

  async authorize(dto: AuthorizeDto): Promise<AuthorizationRequest> {
    // 1. Idempotency — replay cached result unchanged
    const existing = await this.authRepo.findOneBy({ idempotencyKey: dto.idempotencyKey });
    if (existing) return existing;

    // 2. Resolve card
    const card = await this.cardRepo.findOneBy({ id: dto.cardId });
    if (!card) throw new NotFoundException(`Card ${dto.cardId} not found`);

    // 3. Card must be ACTIVE
    if (card.status !== CardStatus.ACTIVE) {
      return this.recordDecline(dto, 'CARD_NOT_ACTIVE');
    }

    // 4. Resolve card product
    const product = await this.productRepo.findOneBy({ id: card.cardProductId });
    if (!product) throw new NotFoundException(`CardProduct ${card.cardProductId} not found`);

    // 5. Channel check — card-level override takes precedence; null means inherit from product
    const flag = CHANNEL_FLAG[dto.channel];
    const channelEnabled = card[flag] ?? product[flag];
    if (!channelEnabled) {
      return this.recordDecline(dto, 'CHANNEL_DISABLED');
    }

    // 6. Per-transaction limit
    const perTxnLimit = card.perTxnLimitMinorUnits ?? product.perTxnLimitMinorUnits;
    if (BigInt(dto.amountMinorUnits) > BigInt(perTxnLimit)) {
      return this.recordDecline(dto, 'PER_TXN_LIMIT_EXCEEDED');
    }

    // 7. Daily limit — sum of today's approved transactions on this account
    const effectiveDailyLimit = card.dailyLimitMinorUnits ?? product.dailyLimitMinorUnits;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTransactions = await this.txnRepo.find({
      where: {
        accountId: card.accountId,
        status: TransactionStatus.APPROVED,
        postedAt: MoreThanOrEqual(todayStart),
      },
      select: ['amountMinorUnits'],
    });
    const dailySpend = todayTransactions.reduce((sum, t) => sum + BigInt(t.amountMinorUnits), 0n);
    if (dailySpend + BigInt(dto.amountMinorUnits) > BigInt(effectiveDailyLimit)) {
      return this.recordDecline(dto, 'DAILY_LIMIT_EXCEEDED');
    }

    // 8. Velocity — count approved transactions for this card within the velocity window
    const windowStart = new Date(Date.now() - product.velocityWindowSeconds * 1000);
    const recentCount = await this.txnRepo.count({
      where: {
        cardId: dto.cardId,
        status: TransactionStatus.APPROVED,
        postedAt: MoreThanOrEqual(windowStart),
      },
    });
    if (recentCount >= product.velocityCount) {
      return this.recordDecline(dto, 'VELOCITY_EXCEEDED');
    }

    // 9. Balance check + optimistic-lock debit (up to 3 retries on concurrent modification)
    let account: Account;
    let balanceAfter!: string;
    for (let attempt = 0; attempt < 3; attempt++) {
      const found = await this.accountRepo.findOneBy({ id: card.accountId });
      if (!found) throw new NotFoundException(`Account ${card.accountId} not found`);
      account = found;

      const balance = BigInt(account.balanceMinorUnits);
      const amount = BigInt(dto.amountMinorUnits);
      if (balance < amount) {
        return this.recordDecline(dto, 'INSUFFICIENT_FUNDS');
      }

      balanceAfter = (balance - amount).toString();
      account.balanceMinorUnits = balanceAfter;
      try {
        await this.accountRepo.save(account);
        break;
      } catch {
        if (attempt === 2) {
          throw new Error('Balance update failed after 3 attempts due to concurrent modification');
        }
      }
    }

    // 10. Create transaction record
    const referenceNumber = `REF-${uuidv4()}`;
    const txn = await this.txnRepo.save(
      this.txnRepo.create({
        cardId: dto.cardId,
        accountId: card.accountId,
        referenceNumber,
        idempotencyKey: dto.idempotencyKey,
        type: TransactionType.AUTHORIZATION,
        channel: dto.channel,
        amountMinorUnits: dto.amountMinorUnits,
        currency: dto.currency,
        merchantName: dto.merchantName ?? null,
        merchantCode: dto.merchantCode ?? null,
        status: TransactionStatus.APPROVED,
        declineReason: null,
      }),
    );

    // 11. Double-entry posting: DEBIT customer account, CREDIT settlement
    await this.postingRepo.save([
      this.postingRepo.create({
        transactionId: txn.id,
        accountId: card.accountId,
        direction: PostingDirection.DEBIT,
        amountMinorUnits: dto.amountMinorUnits,
        balanceAfterMinorUnits: balanceAfter,
      }),
      this.postingRepo.create({
        transactionId: txn.id,
        accountId: SETTLEMENT_ACCOUNT_ID,
        direction: PostingDirection.CREDIT,
        amountMinorUnits: dto.amountMinorUnits,
        balanceAfterMinorUnits: '0',
      }),
    ]);

    await this.auditService.log('Transaction', txn.id, 'AUTHORIZATION_APPROVED', {
      metadata: { cardId: dto.cardId, referenceNumber, amountMinorUnits: dto.amountMinorUnits },
    });

    return this.authRepo.save(
      this.authRepo.create({
        cardId: dto.cardId,
        idempotencyKey: dto.idempotencyKey,
        channel: dto.channel,
        amountMinorUnits: dto.amountMinorUnits,
        currency: dto.currency,
        merchantName: dto.merchantName ?? null,
        merchantCode: dto.merchantCode ?? null,
        result: TransactionStatus.APPROVED,
        declineReason: null,
      }),
    );
  }

  findOne(id: string): Promise<AuthorizationRequest | null> {
    return this.authRepo.findOneBy({ id });
  }

  private async recordDecline(dto: AuthorizeDto, reason: string): Promise<AuthorizationRequest> {
    await this.auditService.log('AuthorizationRequest', dto.idempotencyKey, 'AUTHORIZATION_DECLINED', {
      metadata: { cardId: dto.cardId, reason, amountMinorUnits: dto.amountMinorUnits },
    });
    return this.authRepo.save(
      this.authRepo.create({
        cardId: dto.cardId,
        idempotencyKey: dto.idempotencyKey,
        channel: dto.channel,
        amountMinorUnits: dto.amountMinorUnits,
        currency: dto.currency,
        merchantName: dto.merchantName ?? null,
        merchantCode: dto.merchantCode ?? null,
        result: TransactionStatus.DECLINED,
        declineReason: reason,
      }),
    );
  }
}
