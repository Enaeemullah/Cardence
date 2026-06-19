import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../entities/account.entity';
import { Customer } from '../entities/customer.entity';
import { AccountStatus } from '../common/enums';
import { AuditService } from '../audit/audit.service';
import { CreateAccountDto } from './dto/create-account.dto';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly repo: Repository<Account>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateAccountDto): Promise<Account> {
    const customer = await this.customerRepo.findOneBy({ id: dto.customerId });
    if (!customer) throw new NotFoundException(`Customer ${dto.customerId} not found`);

    const account = this.repo.create({
      customerId: dto.customerId,
      accountNumber: this.generateAccountNumber(),
      currency: dto.currency,
      balanceMinorUnits: '0',
      status: AccountStatus.ACTIVE,
    });
    const saved = await this.repo.save(account);

    await this.auditService.log('Account', saved.id, 'ACCOUNT_CREATED', {
      newState: { accountNumber: saved.accountNumber, currency: saved.currency },
    });
    return saved;
  }

  findAll(): Promise<Account[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Account> {
    const account = await this.repo.findOneBy({ id });
    if (!account) throw new NotFoundException(`Account ${id} not found`);
    return account;
  }

  private generateAccountNumber(): string {
    const ts = Date.now().toString().slice(-8);
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${ts}${rand}`;
  }
}
