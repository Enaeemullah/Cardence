import { IsEnum, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';
import { CardChannel } from '../../common/enums';

export class AuthorizeDto {
  @IsUUID()
  idempotencyKey: string;

  @IsUUID()
  cardId: string;

  @IsEnum(CardChannel)
  channel: CardChannel;

  @IsString()
  @Matches(/^\d+$/, { message: 'amountMinorUnits must be a non-negative integer string' })
  amountMinorUnits: string;

  @IsString()
  @Length(3, 3)
  currency: string;

  @IsString()
  @IsOptional()
  merchantName?: string;

  @IsString()
  @IsOptional()
  merchantCode?: string;
}
