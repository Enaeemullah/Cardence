import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CardProduct } from '../entities/card-product.entity';
import { AuditService } from '../audit/audit.service';
import { CreateCardProductDto } from './dto/create-card-product.dto';
import { UpdateCardProductDto } from './dto/update-card-product.dto';

@Injectable()
export class CardProductsService {
  constructor(
    @InjectRepository(CardProduct)
    private readonly repo: Repository<CardProduct>,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateCardProductDto): Promise<CardProduct> {
    const product = this.repo.create({
      ...dto,
      dailyLimitMinorUnits: String(dto.dailyLimitMinorUnits),
      perTxnLimitMinorUnits: String(dto.perTxnLimitMinorUnits),
      atmEnabled: dto.atmEnabled ?? true,
      posEnabled: dto.posEnabled ?? true,
      ecomEnabled: dto.ecomEnabled ?? true,
      intlEnabled: dto.intlEnabled ?? false,
    });
    const saved = await this.repo.save(product);
    await this.auditService.log('CardProduct', saved.id, 'CARD_PRODUCT_CREATED', {
      newState: { name: saved.name, network: saved.network },
    });
    return saved;
  }

  findAll(): Promise<CardProduct[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<CardProduct> {
    const product = await this.repo.findOneBy({ id });
    if (!product) throw new NotFoundException(`CardProduct ${id} not found`);
    return product;
  }

  async update(id: string, dto: UpdateCardProductDto): Promise<CardProduct> {
    const product = await this.findOne(id);
    if (dto.name !== undefined) product.name = dto.name;
    if (dto.dailyLimitMinorUnits !== undefined) product.dailyLimitMinorUnits = String(dto.dailyLimitMinorUnits);
    if (dto.perTxnLimitMinorUnits !== undefined) product.perTxnLimitMinorUnits = String(dto.perTxnLimitMinorUnits);
    if (dto.velocityCount !== undefined) product.velocityCount = dto.velocityCount;
    if (dto.velocityWindowSeconds !== undefined) product.velocityWindowSeconds = dto.velocityWindowSeconds;
    if (dto.atmEnabled !== undefined) product.atmEnabled = dto.atmEnabled;
    if (dto.posEnabled !== undefined) product.posEnabled = dto.posEnabled;
    if (dto.ecomEnabled !== undefined) product.ecomEnabled = dto.ecomEnabled;
    if (dto.intlEnabled !== undefined) product.intlEnabled = dto.intlEnabled;
    const saved = await this.repo.save(product);
    await this.auditService.log('CardProduct', id, 'CARD_PRODUCT_UPDATED', {
      newState: { name: saved.name },
    });
    return saved;
  }
}
