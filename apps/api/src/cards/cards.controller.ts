import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CardsService } from './cards.service';
import { RequestCardDto } from './dto/request-card.dto';
import { SetPinDto } from './dto/set-pin.dto';
import { RequestLimitChangeDto } from './dto/request-limit-change.dto';
import { CardStatus } from '../common/enums';

@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get()
  findAll(
    @Query('accountId') accountId?: string,
    @Query('status') status?: CardStatus,
  ) {
    return this.cardsService.findAll(accountId, status);
  }

  @Post()
  requestCard(@Body() dto: RequestCardDto) {
    return this.cardsService.requestCard(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cardsService.findOne(id);
  }

  @Post(':id/activate')
  activate(@Param('id') id: string) {
    return this.cardsService.activate(id);
  }

  @Post(':id/block')
  block(@Param('id') id: string) {
    return this.cardsService.block(id);
  }

  @Post(':id/unblock')
  unblock(@Param('id') id: string) {
    return this.cardsService.unblock(id);
  }

  @Post(':id/hotlist')
  hotlist(@Param('id') id: string) {
    return this.cardsService.hotlist(id);
  }

  @Post(':id/pin')
  @HttpCode(204)
  async setPin(@Param('id') id: string, @Body() dto: SetPinDto): Promise<void> {
    await this.cardsService.setPin(id, dto.pin);
  }

  @Post(':id/pin/reset')
  @HttpCode(204)
  async resetPin(@Param('id') id: string): Promise<void> {
    await this.cardsService.resetPin(id);
  }

  @Post(':id/renew')
  renew(@Param('id') id: string) {
    return this.cardsService.renew(id);
  }

  @Post(':id/replace')
  replace(@Param('id') id: string) {
    return this.cardsService.replace(id);
  }

  @Post(':id/close')
  close(@Param('id') id: string) {
    return this.cardsService.close(id);
  }

  @Post(':id/limits')
  requestLimitChange(@Param('id') id: string, @Body() dto: RequestLimitChangeDto) {
    return this.cardsService.requestLimitChange(id, dto);
  }

  @Get(':id/transactions')
  getTransactions(@Param('id') id: string) {
    return this.cardsService.getTransactions(id);
  }
}
