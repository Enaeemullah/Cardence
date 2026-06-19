import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MakerCheckerRequest } from '../entities/maker-checker-request.entity';
import { Card } from '../entities/card.entity';
import { CardStatus, MakerCheckerStatus, MakerCheckerType } from '../common/enums';
import { CardLifecycleService } from '../card-lifecycle/card-lifecycle.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class MakerCheckerService {
  constructor(
    @InjectRepository(MakerCheckerRequest)
    private readonly repo: Repository<MakerCheckerRequest>,
    @InjectRepository(Card)
    private readonly cardRepo: Repository<Card>,
    private readonly lifecycle: CardLifecycleService,
    private readonly auditService: AuditService,
  ) {}

  findPending(): Promise<MakerCheckerRequest[]> {
    return this.repo.find({
      where: { status: MakerCheckerStatus.PENDING },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<MakerCheckerRequest> {
    const req = await this.repo.findOneBy({ id });
    if (!req) throw new NotFoundException(`Approval ${id} not found`);
    return req;
  }

  async approve(id: string, approverId: string): Promise<MakerCheckerRequest> {
    const approval = await this.findOne(id);

    if (approval.status !== MakerCheckerStatus.PENDING) {
      throw new BadRequestException(`Approval is already ${approval.status}`);
    }
    if (approval.initiatorUserId === approverId) {
      throw new BadRequestException('Maker and checker must be different users (four-eyes principle)');
    }

    if (approval.type === MakerCheckerType.CARD_ISSUANCE) {
      const { cardId } = approval.payload as { cardId: string };
      const card = await this.cardRepo.findOneBy({ id: cardId });
      if (!card) throw new NotFoundException(`Card ${cardId} not found`);

      card.status = this.lifecycle.transition(card, CardStatus.ISSUED);
      await this.cardRepo.save(card);

      await this.auditService.log('Card', cardId, 'CARD_ISSUED', {
        actorUserId: approverId,
        previousState: { status: CardStatus.REQUESTED },
        newState: { status: CardStatus.ISSUED },
        metadata: { approvalId: id },
      });
    }

    if (approval.type === MakerCheckerType.LIMIT_CHANGE) {
      const payload = approval.payload as {
        cardId: string;
        dailyLimitMinorUnits?: string;
        perTxnLimitMinorUnits?: string;
      };
      const card = await this.cardRepo.findOneBy({ id: payload.cardId });
      if (!card) throw new NotFoundException(`Card ${payload.cardId} not found`);

      const prev = {
        dailyLimitMinorUnits: card.dailyLimitMinorUnits,
        perTxnLimitMinorUnits: card.perTxnLimitMinorUnits,
      };
      if (payload.dailyLimitMinorUnits !== undefined) {
        card.dailyLimitMinorUnits = payload.dailyLimitMinorUnits;
      }
      if (payload.perTxnLimitMinorUnits !== undefined) {
        card.perTxnLimitMinorUnits = payload.perTxnLimitMinorUnits;
      }
      await this.cardRepo.save(card);

      await this.auditService.log('Card', payload.cardId, 'LIMIT_CHANGE_APPLIED', {
        actorUserId: approverId,
        previousState: prev,
        newState: payload,
        metadata: { approvalId: id },
      });
    }

    approval.status = MakerCheckerStatus.APPROVED;
    approval.approverUserId = approverId;
    approval.decidedAt = new Date();
    const saved = await this.repo.save(approval);

    await this.auditService.log('MakerCheckerRequest', id, 'APPROVAL_APPROVED', {
      actorUserId: approverId,
      previousState: { status: MakerCheckerStatus.PENDING },
      newState: { status: MakerCheckerStatus.APPROVED },
    });
    return saved;
  }

  async reject(id: string, approverId: string): Promise<MakerCheckerRequest> {
    const approval = await this.findOne(id);

    if (approval.status !== MakerCheckerStatus.PENDING) {
      throw new BadRequestException(`Approval is already ${approval.status}`);
    }
    if (approval.initiatorUserId === approverId) {
      throw new BadRequestException('Maker and checker must be different users (four-eyes principle)');
    }

    approval.status = MakerCheckerStatus.REJECTED;
    approval.approverUserId = approverId;
    approval.decidedAt = new Date();
    const saved = await this.repo.save(approval);

    await this.auditService.log('MakerCheckerRequest', id, 'APPROVAL_REJECTED', {
      actorUserId: approverId,
      previousState: { status: MakerCheckerStatus.PENDING },
      newState: { status: MakerCheckerStatus.REJECTED },
    });
    return saved;
  }
}
