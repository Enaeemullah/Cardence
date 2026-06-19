import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { UserRole } from '../common/enums';
import { Roles } from '../auth/decorators/roles.decorator';
import { CardProductsService } from './card-products.service';
import { CreateCardProductDto } from './dto/create-card-product.dto';
import { UpdateCardProductDto } from './dto/update-card-product.dto';

@Controller('card-products')
export class CardProductsController {
  constructor(private readonly cardProductsService: CardProductsService) {}

  @Get()
  findAll() {
    return this.cardProductsService.findAll();
  }

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateCardProductDto) {
    return this.cardProductsService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cardProductsService.findOne(id);
  }

  @Roles(UserRole.ADMIN)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCardProductDto) {
    return this.cardProductsService.update(id, dto);
  }
}
