import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { AuditService } from '../audit/audit.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly repo: Repository<Customer>,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateCustomerDto): Promise<Customer> {
    const customer = this.repo.create({
      ...dto,
      phone: dto.phone ?? null,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
    });
    const saved = await this.repo.save(customer);
    await this.auditService.log('Customer', saved.id, 'CUSTOMER_CREATED', {
      newState: { email: saved.email, firstName: saved.firstName, lastName: saved.lastName },
    });
    return saved;
  }

  findAll(): Promise<Customer[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.repo.findOneBy({ id });
    if (!customer) throw new NotFoundException(`Customer ${id} not found`);
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);
    Object.assign(customer, {
      ...(dto.firstName !== undefined && { firstName: dto.firstName }),
      ...(dto.lastName !== undefined && { lastName: dto.lastName }),
      ...(dto.email !== undefined && { email: dto.email }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
      ...(dto.dateOfBirth !== undefined && { dateOfBirth: new Date(dto.dateOfBirth) }),
    });
    const saved = await this.repo.save(customer);
    await this.auditService.log('Customer', id, 'CUSTOMER_UPDATED', {
      newState: { email: saved.email },
    });
    return saved;
  }
}
