import { Controller, Get, Param, Post } from '@nestjs/common';
import { UserRole } from '../common/enums';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { MakerCheckerService } from './maker-checker.service';

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

  @Roles(UserRole.APPROVER, UserRole.ADMIN)
  @Post(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.makerCheckerService.approve(id, user.sub);
  }

  @Roles(UserRole.APPROVER, UserRole.ADMIN)
  @Post(':id/reject')
  reject(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.makerCheckerService.reject(id, user.sub);
  }
}
