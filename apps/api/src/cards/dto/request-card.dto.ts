import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class RequestCardDto {
  @IsUUID()
  accountId: string;

  @IsUUID()
  cardProductId: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  dailyLimitMinorUnits?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  perTxnLimitMinorUnits?: number;
}
