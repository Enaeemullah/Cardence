import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { UserRole } from '../common/enums';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthorizationService } from './authorization.service';
import { AuthorizeDto } from './dto/authorize.dto';

@Controller('authorizations')
export class AuthorizationController {
  constructor(private readonly authorizationService: AuthorizationService) {}

  @Roles(UserRole.OFFICER, UserRole.ADMIN)
  @Post()
  authorize(@Body() dto: AuthorizeDto) {
    return this.authorizationService.authorize(dto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const record = await this.authorizationService.findOne(id);
    if (!record) throw new NotFoundException(`Authorization ${id} not found`);
    return record;
  }
}
