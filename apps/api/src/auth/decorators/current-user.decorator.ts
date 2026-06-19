import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { JwtPayload } from '../jwt-payload.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    return ctx.switchToHttp().getRequest().user as JwtPayload;
  },
);
