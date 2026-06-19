import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { UserRole, CardStatus } from '../common/enums';
import { Roles } from '../auth/decorators/roles.decorator';
import { CardsService } from './cards.service';
import { RequestCardDto } from './dto/request-card.dto';
import { SetPinDto } from './dto/set-pin.dto';
import { RequestLimitChangeDto } from './dto/request-limit-change.dto';

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

  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  @Post()
  requestCard(@Body() dto: RequestCardDto) {
    return this.cardsService.requestCard(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cardsService.findOne(id);
  }

  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  @Post(':id/activate')
  activate(@Param('id') id: string) {
    return this.cardsService.activate(id);
  }

  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  @Post(':id/block')
  block(@Param('id') id: string) {
    return this.cardsService.block(id);
  }

  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  @Post(':id/unblock')
  unblock(@Param('id') id: string) {
    return this.cardsService.unblock(id);
  }

  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  @Post(':id/hotlist')
  hotlist(@Param('id') id: string) {
    return this.cardsService.hotlist(id);
  }

  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  @Post(':id/pin')
  @HttpCode(204)
  async setPin(@Param('id') id: string, @Body() dto: SetPinDto): Promise<void> {
    await this.cardsService.setPin(id, dto.pin);
  }

  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  @Post(':id/pin/reset')
  @HttpCode(204)
  async resetPin(@Param('id') id: string): Promise<void> {
    await this.cardsService.resetPin(id);
  }

  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  @Post(':id/renew')
  renew(@Param('id') id: string) {
    return this.cardsService.renew(id);
  }

  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  @Post(':id/replace')
  replace(@Param('id') id: string) {
    return this.cardsService.replace(id);
  }

  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  @Post(':id/close')
  close(@Param('id') id: string) {
    return this.cardsService.close(id);
  }

  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  @Post(':id/limits')
  requestLimitChange(@Param('id') id: string, @Body() dto: RequestLimitChangeDto) {
    return this.cardsService.requestLimitChange(id, dto);
  }

  @Get(':id/transactions')
  getTransactions(@Param('id') id: string) {
    return this.cardsService.getTransactions(id);
  }
}
