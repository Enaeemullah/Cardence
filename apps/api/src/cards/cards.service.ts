import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Card } from '../entities/card.entity';
import { Account } from '../entities/account.entity';
import { CardProduct } from '../entities/card-product.entity';
import { MakerCheckerRequest } from '../entities/maker-checker-request.entity';
import { CardStatus, MakerCheckerStatus, MakerCheckerType } from '../common/enums';
import { CardLifecycleService } from '../card-lifecycle/card-lifecycle.service';
import { AuditService } from '../audit/audit.service';
import { PinService } from '../pin/pin.service';
import { RequestCardDto } from './dto/request-card.dto';
import { RequestLimitChangeDto } from './dto/request-limit-change.dto';

@Injectable()
export class CardsService {
  constructor(
    @InjectRepository(Card)
    private readonly cardRepo: Repository<Card>,
    @InjectRepository(Account)
    private readonly accountRepo: Repository<Account>,
    @InjectRepository(CardProduct)
    private readonly cardProductRepo: Repository<CardProduct>,
    @InjectRepository(MakerCheckerRequest)
    private readonly approvalRepo: Repository<MakerCheckerRequest>,
    private readonly lifecycle: CardLifecycleService,
    private readonly auditService: AuditService,
    private readonly pinService: PinService,
  ) {}

  async requestCard(
    dto: RequestCardDto,
    actorUserId?: string,
  ): Promise<{ card: Card; approval: MakerCheckerRequest }> {
    const account = await this.accountRepo.findOneBy({ id: dto.accountId });
    if (!account) throw new NotFoundException(`Account ${dto.accountId} not found`);

    const product = await this.cardProductRepo.findOneBy({ id: dto.cardProductId });
    if (!product) throw new NotFoundException(`CardProduct ${dto.cardProductId} not found`);

    // Simulated PAN — raw PAN never stored or logged
    const panToken = uuidv4();
    const last4 = String(Math.floor(Math.random() * 10000)).padStart(4, '0');

    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 3);

    const card = this.cardRepo.create({
      accountId: dto.accountId,
      cardProductId: dto.cardProductId,
      panToken,
      panLast4: last4,
      panMasked: `****-****-****-${last4}`,
      expiryMonth: expiry.getMonth() + 1,
      expiryYear: expiry.getFullYear(),
      status: CardStatus.REQUESTED,
      pinBlockHash: null,
      dailyLimitMinorUnits: dto.dailyLimitMinorUnits != null ? String(dto.dailyLimitMinorUnits) : null,
      perTxnLimitMinorUnits: dto.perTxnLimitMinorUnits != null ? String(dto.perTxnLimitMinorUnits) : null,
      atmEnabled: null,
      posEnabled: null,
      ecomEnabled: null,
      intlEnabled: null,
      parentCardId: null,
      closedAt: null,
    });
    const savedCard = await this.cardRepo.save(card);

    const approval = this.approvalRepo.create({
      type: MakerCheckerType.CARD_ISSUANCE,
      initiatorUserId: actorUserId ?? 'system',
      approverUserId: null,
      status: MakerCheckerStatus.PENDING,
      payload: { cardId: savedCard.id },
      decidedAt: null,
    });
    const savedApproval = await this.approvalRepo.save(approval);

    await this.auditService.log('Card', savedCard.id, 'CARD_REQUESTED', {
      actorUserId,
      newState: { status: CardStatus.REQUESTED, panMasked: savedCard.panMasked },
      metadata: { approvalId: savedApproval.id },
    });

    return { card: savedCard, approval: savedApproval };
  }

  async activate(cardId: string, actorUserId?: string): Promise<Card> {
    const card = await this.findOne(cardId);
    const prev = card.status;
    card.status = this.lifecycle.transition(card, CardStatus.ACTIVE);
    const saved = await this.cardRepo.save(card);
    await this.auditService.log('Card', cardId, 'CARD_ACTIVATED', {
      actorUserId,
      previousState: { status: prev },
      newState: { status: CardStatus.ACTIVE },
    });
    return saved;
  }

  async block(cardId: string, actorUserId?: string): Promise<Card> {
    const card = await this.findOne(cardId);
    const prev = card.status;
    card.status = this.lifecycle.transition(card, CardStatus.BLOCKED);
    const saved = await this.cardRepo.save(card);
    await this.auditService.log('Card', cardId, 'CARD_BLOCKED', {
      actorUserId,
      previousState: { status: prev },
      newState: { status: CardStatus.BLOCKED },
    });
    return saved;
  }

  async unblock(cardId: string, actorUserId?: string): Promise<Card> {
    const card = await this.findOne(cardId);
    const prev = card.status;
    card.status = this.lifecycle.transition(card, CardStatus.ACTIVE);
    const saved = await this.cardRepo.save(card);
    await this.auditService.log('Card', cardId, 'CARD_UNBLOCKED', {
      actorUserId,
      previousState: { status: prev },
      newState: { status: CardStatus.ACTIVE },
    });
    return saved;
  }

  async hotlist(cardId: string, actorUserId?: string): Promise<Card> {
    const card = await this.findOne(cardId);
    const prev = card.status;
    card.status = this.lifecycle.transition(card, CardStatus.HOTLISTED);
    const saved = await this.cardRepo.save(card);
    await this.auditService.log('Card', cardId, 'CARD_HOTLISTED', {
      actorUserId,
      previousState: { status: prev },
      newState: { status: CardStatus.HOTLISTED },
    });
    return saved;
  }

  async setPin(cardId: string, pin: string, actorUserId?: string): Promise<void> {
    const card = await this.findOne(cardId);
    if (card.status !== CardStatus.ACTIVE && card.status !== CardStatus.ISSUED) {
      throw new BadRequestException(
        `PIN can only be set on ISSUED or ACTIVE cards. Current status: ${card.status}`,
      );
    }
    // Plaintext PIN is hashed immediately and never stored or logged
    card.pinBlockHash = await this.pinService.hashPin(pin);
    await this.cardRepo.save(card);
    await this.auditService.log('Card', cardId, 'CARD_PIN_SET', { actorUserId });
  }

  async resetPin(cardId: string, actorUserId?: string): Promise<void> {
    const card = await this.findOne(cardId);
    card.pinBlockHash = null;
    await this.cardRepo.save(card);
    await this.auditService.log('Card', cardId, 'CARD_PIN_RESET', { actorUserId });
  }

  async renew(cardId: string, actorUserId?: string): Promise<Card> {
    const card = await this.findOne(cardId);
    if (card.status !== CardStatus.ACTIVE) {
      throw new BadRequestException(`Card must be ACTIVE to renew. Current status: ${card.status}`);
    }
    const prevExpiry = { expiryMonth: card.expiryMonth, expiryYear: card.expiryYear };
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 3);
    card.expiryMonth = expiry.getMonth() + 1;
    card.expiryYear = expiry.getFullYear();
    const saved = await this.cardRepo.save(card);
    await this.auditService.log('Card', cardId, 'CARD_RENEWED', {
      actorUserId,
      previousState: prevExpiry,
      newState: { expiryMonth: card.expiryMonth, expiryYear: card.expiryYear },
    });
    return saved;
  }

  async replace(
    cardId: string,
    actorUserId?: string,
  ): Promise<{ card: Card; approval: MakerCheckerRequest }> {
    const oldCard = await this.findOne(cardId);
    const prev = oldCard.status;
    oldCard.status = this.lifecycle.transition(oldCard, CardStatus.CLOSED);
    oldCard.closedAt = new Date();
    await this.cardRepo.save(oldCard);
    await this.auditService.log('Card', cardId, 'CARD_REPLACED', {
      actorUserId,
      previousState: { status: prev },
      newState: { status: CardStatus.CLOSED },
    });
    // Create a replacement card linked to the old one
    const result = await this.requestCard(
      { accountId: oldCard.accountId, cardProductId: oldCard.cardProductId },
      actorUserId,
    );
    result.card.parentCardId = cardId;
    await this.cardRepo.save(result.card);
    return result;
  }

  async close(cardId: string, actorUserId?: string): Promise<Card> {
    const card = await this.findOne(cardId);
    const prev = card.status;
    card.status = this.lifecycle.transition(card, CardStatus.CLOSED);
    card.closedAt = new Date();
    const saved = await this.cardRepo.save(card);
    await this.auditService.log('Card', cardId, 'CARD_CLOSED', {
      actorUserId,
      previousState: { status: prev },
      newState: { status: CardStatus.CLOSED },
    });
    return saved;
  }

  async requestLimitChange(
    cardId: string,
    dto: RequestLimitChangeDto,
    actorUserId?: string,
  ): Promise<MakerCheckerRequest> {
    await this.findOne(cardId); // verifies card exists
    if (dto.dailyLimitMinorUnits == null && dto.perTxnLimitMinorUnits == null) {
      throw new BadRequestException('At least one limit field must be provided');
    }
    const approval = this.approvalRepo.create({
      type: MakerCheckerType.LIMIT_CHANGE,
      initiatorUserId: actorUserId ?? 'system',
      approverUserId: null,
      status: MakerCheckerStatus.PENDING,
      payload: {
        cardId,
        ...(dto.dailyLimitMinorUnits != null && {
          dailyLimitMinorUnits: String(dto.dailyLimitMinorUnits),
        }),
        ...(dto.perTxnLimitMinorUnits != null && {
          perTxnLimitMinorUnits: String(dto.perTxnLimitMinorUnits),
        }),
      },
      decidedAt: null,
    });
    const saved = await this.approvalRepo.save(approval);
    await this.auditService.log('Card', cardId, 'LIMIT_CHANGE_REQUESTED', {
      actorUserId,
      metadata: { approvalId: saved.id },
    });
    return saved;
  }

  async findOne(cardId: string): Promise<Card> {
    const card = await this.cardRepo.findOneBy({ id: cardId });
    if (!card) throw new NotFoundException(`Card ${cardId} not found`);
    return card;
  }

  findAll(accountId?: string, status?: CardStatus): Promise<Card[]> {
    const where: FindOptionsWhere<Card> = {};
    if (accountId) where.accountId = accountId;
    if (status) where.status = status;
    return this.cardRepo.findBy(where);
  }
}
