import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsUUID } from 'class-validator';
import { MakerCheckerService } from './maker-checker.service';

class DecideDto {
  @IsUUID()
  approverId: string; // Phase 5 will replace this with JWT user; kept here for Phase 3 testability
}

@Controller('approvals')
export class MakerCheckerController {
  constructor(private readonly makerCheckerService: MakerCheckerService) {}

  @Get()
  findPending() {
    return this.makerCheckerService.findPending();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.makerCheckerService.findOne(id);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() dto: DecideDto) {
    return this.makerCheckerService.approve(id, dto.approverId);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() dto: DecideDto) {
    return this.makerCheckerService.reject(id, dto.approverId);
  }
}
